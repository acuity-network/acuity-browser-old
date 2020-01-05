<template>
  <page>
    <template slot="title">
      {{ $t('Debug.DebugItem') }}
    </template>

    <template slot="body">
      <b-field label="itemId">
        <b-input v-model.trim="itemId" @keydown.native.enter="read" autocomplete="off" inputmode="verbatim" spellcheck="false" size="66"></b-input>
      </b-field>
      <button class="button is-primary" @click="read">{{ $t('Debug.ReadItem') }}</button>
      <code v-html="output" style="display: block; white-space: pre;"></code>
    </template>
  </page>
</template>

<script lang="ts">
  import Page from './Page.vue'
  import ItemProto from '../../lib/protobuf/Item_pb.js'
  import LanguageMixinProto from '../../lib/protobuf/LanguageMixin_pb.js'
  import TitleMixinProto from '../../lib/protobuf/TitleMixin_pb.js'
  import BodyTextMixinProto from '../../lib/protobuf/BodyTextMixin_pb.js'
  import MixinSchemaMixinProto from '../../lib/protobuf/MixinSchemaMixin_pb.js'
  import ImageMixinProto from '../../lib/protobuf/ImageMixin_pb.js'
  import brotli from '../../lib/brotli'
  import bs58 from 'bs58'
  import multihashes from 'multihashes'
  import formatByteCount from '../../lib/formatByteCount'
  import setTitle from '../../lib/setTitle'
  import clipboard from '../../lib/clipboard'

  // https://github.com/jasonmoo/t.js/blob/master/t.js
  function scrub(val) {
		return new Option(val).innerHTML
	}

  export default {
    name: 'debug',
    components: {
      Page,
    },
    data() {
      return {
        itemId: '',
        output: '',
      }
    },
    created() {
      setTitle(this.$t('Debug.DebugItem'))
      let clipboardText: string = clipboard.readText()

      try {
        bs58.decode(clipboardText)
        switch (clipboardText.length) {
          case 32:
          case 33:
            this.itemId = clipboardText
        }
      }
      catch (e) {
        if (this.$mixClient.web3.utils.isHexStrict(clipboardText) && clipboardText.length == 66) {
          this.itemId = clipboardText
        }
      }
    },
    methods: {
      async read(event) {
        this.output = ''
        let itemId: string
        if (this.$mixClient.web3.utils.isHexStrict(this.itemId) && this.itemId.length == 66) {
          itemId = this.itemId
        }
        else {
          itemId = '0x' + bs58.decode(this.itemId).toString('hex') + 'f1b5847865d2094d'
        }

        let shortId = await this.$mixClient.itemStoreShortId.methods.getShortId(itemId).call()
        this.output += 'shortId: '  + shortId + '\n'

        let itemStoreAddress
        try {
          itemStoreAddress = await this.$mixClient.itemStoreRegistry.methods.getItemStore(itemId).call()
        }
        catch (e) {
          this.output += this.$t('Debug.itemStoreNotFound') + '\n'
          return
        }
        this.output += 'itemStoreAddress: '  + itemStoreAddress + '\n'

        let itemStoreAbi = require('../../lib/contracts/MixItemStoreInterface.abi.json')
        let itemStore = new this.$mixClient.web3.eth.Contract(itemStoreAbi, itemStoreAddress)

        let inUse = await itemStore.methods.getInUse(itemId).call()
        if (!inUse) {
          this.output += this.$t('Debug.ItemNotFound') + '\n'
          return
        }

        let contractId = await itemStore.methods.getContractId().call()
        if (contractId != "0xf1b5847865d2094d") {
          this.output += this.$t('Debug.UnsupportedItemStore') + '\n'
          return
        }
        this.output += 'itemStore: ItemStoreIpfsSha256\n'

        let item = await this.$mixClient.itemStoreIpfsSha256.methods.getItem(itemId).call()
        this.output += this.$t('Debug.Updatable') + ': ' + ((item.flags & 0x01) ? 'true' : 'false') + '\n' +
          this.$t('Debug.EnforceRevisions') + ': ' + ((item.flags & 0x02) ? 'true' : "false") + '\n' +
          this.$t('Debug.Retractable') + ': ' + ((item.flags & 0x04) ? 'true' : 'false') + '\n' +
          this.$t('Debug.Transferable') + ': ' + ((item.flags & 0x08) ? 'true' : 'false') + '\n' +
          this.$t('Debug.Owner') + ': ' + item.owner + '\n' +
          this.$t('Debug.RevisionCount') + ': ' + item.ipfsHashes.length + '\n'

        for (let i = 0; i < item.ipfsHashes.length; i++) {
          this.output += '\n' + this.$t('Debug.Revision') + '  ' + i + '\n'

          let timestamp = new Date(item.timestamps[i] * 1000)
          this.output += this.$t('Debug.Timestamp') + ': ' + timestamp + '\n'

          let ipfsHash = multihashes.toB58String(multihashes.encode(Buffer.from(item.ipfsHashes[i].substr(2), 'hex'), 'sha2-256'))
          this.output += this.$t('Debug.IpfsHash') + ': ' + ipfsHash + '\n'

          let response = await this.$ipfsClient.get(ipfsHash)
          let containerPayload = Buffer.from(response.toString('utf8'), 'binary')
          this.output += this.$t('Debug.CompressedLength') + ': ' + formatByteCount(containerPayload.length) + '\n'

          let itemPayload = Buffer.from(await brotli.decompress(containerPayload))
          this.output += this.$t('Debug.UncompressedLength') + ': ' + formatByteCount(itemPayload.length) + '\n'

          let itemMessage = ItemProto.Item.deserializeBinary(itemPayload)
          let mixins = itemMessage.getMixinPayloadList()

          this.output += this.$t('Debug.MixinCount') + ': ' + mixins.length + '\n'

          for (let i = 0; i < mixins.length; i++) {
            this.output += '\nMixin ' + i + '\n'
            let mixinId = '0x' + ('00000000' + mixins[i].getMixinId().toString(16)).slice(-8)
            this.output += 'mixinId: ' + mixinId + '\n'

            let mixinPayload = mixins[i].getPayload()

            switch (mixinId) {
              case '0x51c32e3a':
                this.output += this.$t('Debug.MixinType') + ': ' + this.$t('Debug.MixinType') + '\n'
                break

              case '0x9bc7a0e6':
                this.output += this.$t('Debug.MixinType') + ': ' + this.$t('Debug.LanguageTag') + '\n'
                let languageMessage = LanguageMixinProto.LanguageMixin.deserializeBinary(mixinPayload)
                this.output += this.$t('Debug.LanguageTag') + ': '  + scrub(languageMessage.getLanguageTag()) + '\n'
                break

              case '0x344f4812':
                this.output += this.$t('Debug.MixinType') + ': ' + this.$t('Debug.Title') + '\n'
                let titleMessage = TitleMixinProto.TitleMixin.deserializeBinary(mixinPayload)
                this.output += this.$t('Debug.Title') + ': '  + scrub(titleMessage.getTitle()) + '\n'
                break

              case '0x2d382044':
                this.output += this.$t('Debug.MixinType') + ': ' + this.$t('Debug.BodyText') + '\n'
                let bodyTextMessage = BodyTextMixinProto.BodyTextMixin.deserializeBinary(mixinPayload)
                this.output += this.$t('Debug.BodyText') + ':\n'  + scrub(bodyTextMessage.getBodyText()) + '\n'
                break

              case '0xcdce4e5d':
                this.output += this.$t('Debug.MixinType') + ': ' + this.$t('Debug.MixinSchema') + '\n'
                let mixinSchemaMessage = MixinSchemaMixinProto.MixinSchemaMixin.deserializeBinary(mixinPayload)
                this.output += this.$t('Debug.MixinSchema') + ':\n'  + scrub(mixinSchemaMessage.getMixinSchema()) + '\n'
                break

              case '0x045eee8c':
                this.output += this.$t('Debug.MixinType') + ': ' + this.$t('Debug.Image') + '\n'
                let imageMessage = ImageMixinProto.ImageMixin.deserializeBinary(mixinPayload)
                let width = imageMessage.getWidth()
                this.output += this.$t('Debug.OriginalWidth') + ': ' + width + '\n'
                let height = imageMessage.getHeight()
                this.output += this.$t('Debug.OriginalHeight') + ': ' + height + '\n'
                let mipmaps = imageMessage.getMipmapLevelList()
                this.output += this.$t('Debug.MipmapLevels') + ': ' + mipmaps.length + '\n'
                let renderHeight = Math.round(256 * height / width)
                for (let j = 0; j < mipmaps.length; j++) {
                  this.output += '\n' + this.$t('Debug.MipmapLevel') + ': ' + j + '\n'
                  this.output += this.$t('Debug.MipmapFilesize') + ': ' + formatByteCount(mipmaps[j].getFilesize()) + '\n'
                  this.output += '<img src="http://127.0.0.1:5102/ipfs/' + bs58.encode(Buffer.from(mipmaps[j].getIpfsHash())) + '" width="256" height="' + renderHeight + '" style="display: block;">'
                }
                break

              case '0xbcec8faa':
                this.output += this.$t('Debug.MixinType') + ': ' + this.$t('Debug.TopicFeed') + '\n'
                break
            }
          }
        }
      }
    }
  }
</script>

<style scoped>
  div >>> input {
    font-family: 'Source Code Pro';
  }
</style>
