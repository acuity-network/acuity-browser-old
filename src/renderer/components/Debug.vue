<template>
  <page>
    <template slot="title">
      {{ $t('debugItem') }}
    </template>

    <template slot="body">
      <b-field :label="$t('itemId')" :message="message">
        <b-input v-model="itemId" @keydown.native.enter="read" autocomplete="off" inputmode="verbatim" placeholder="0x0000000000000000000000000000000000000000000000000000000000000000" spellcheck="false" size="66" style="font-family: monospace;"></b-input>
      </b-field>
      <button class="button is-primary" @click="read">{{ $t('readItem') }}</button>
      <code id="output" style="display: block; white-space: pre;"></code>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import ItemProto from '../../lib/protobuf/Item_pb.js'
  import LanguageMixinProto from '../../lib/protobuf/LanguageMixin_pb.js'
  import TitleMixinProto from '../../lib/protobuf/TitleMixin_pb.js'
  import BodyTextMixinProto from '../../lib/protobuf/BodyTextMixin_pb.js'
  import MixinSchemaMixinProto from '../../lib/protobuf/MixinSchemaMixin_pb.js'
  import ImageMixin from '../../lib/protobuf/ImageMixin_pb.js'
  import brotli from 'iltorb'
  import Base58 from 'base-58'
  import multihashes from 'multihashes'
  import formatByteCount from '../../lib/formatByteCount.js'
  import MixItem from '../../lib/MixItem.js'
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'debug',
    components: {
      Page,
    },
    data() {
      return {
        itemId: '',
        message: '',
      }
    },
    created() {
      setTitle(this.$t('debugItem'))
    },
    methods: {
      async read(event) {
        let output = document.getElementById('output')
        output.innerHTML = ''

        this.itemId = this.itemId.trim()
        try {
          let item = await new MixItem(this.$root, this.itemId).init()
        }
        catch (e) {
          this.message = 'Item not found.'
          return
        }

        this.message = ''

        let shortId = await this.$mixClient.itemStoreShortId.methods.getShortId(this.itemId).call()
        output.appendChild(document.createTextNode('shortId: '  + shortId + '\n'))

        let itemStoreAddress = await this.$mixClient.itemStoreRegistry.methods.getItemStore(this.itemId).call()
        output.appendChild(document.createTextNode('itemStoreAddress: '  + itemStoreAddress + '\n'))

        let itemStoreAbi = require('../../lib/contracts/MixItemStoreInterface.abi.json')
        let itemStore = new this.$mixClient.web3.eth.Contract(itemStoreAbi, itemStoreAddress)

        let inUse = await itemStore.methods.getInUse(this.itemId).call()
        if (!inUse) {
          output.append('Item not found.\n')
          return
        }

        let contractId = await itemStore.methods.getContractId().call()
        if (contractId != "0xf1b5847865d2094d") {
          output.append('Unknown item store.\n')
          return
        }
        output.append('itemStore: ItemStoreIpfsSha256\n')

        let item = await this.$mixClient.itemStoreIpfsSha256.methods.getItem(this.itemId).call()
        output.append('Updatable: ' + ((item.flags & 0x01) ? 'true' : 'false') + '\n')
        output.append('Enforce revisions: ' + ((item.flags & 0x02) ? 'true' : "false") + '\n')
        output.append('Retractable: ' + ((item.flags & 0x04) ? 'true' : 'false') + '\n')
        output.append('Transferable: ' + ((item.flags & 0x08) ? 'true' : 'false') + '\n')
        output.append('Owner: ' + item.owner + '\n')
        output.append('Revision count: ' + item.ipfsHashes.length + '\n')

        for (let i = 0; i < item.ipfsHashes.length; i++) {
          let timestamp = new Date(item.timestamps[i] * 1000)
          output.append('\nRevision ' + i + ' timestamp: ' + timestamp + '\n')

          let ipfsHash = multihashes.toB58String(multihashes.encode(Buffer.from(item.ipfsHashes[i].substr(2), "hex"), 'sha2-256'))
          output.append('Revision ' + i + ' IPFS hash: ' + ipfsHash + '\n')

          let response = await this.$ipfsClient.get('cat?arg=/ipfs/' + ipfsHash, false)
          let containerPayload = Buffer.from(response, "binary")
          output.append('Compressed length: ' + formatByteCount(containerPayload.length) + '\n')

          let itemPayload = await brotli.decompress(Buffer.from(containerPayload))
          output.append('Uncompressed length: ' + formatByteCount(itemPayload.length) + '\n')

          let itemMessage = ItemProto.Item.deserializeBinary(itemPayload)
          let mixins = itemMessage.getMixinPayloadList()

          output.append('Mixin count: ' + mixins.length + '\n')

          for (let i = 0; i < mixins.length; i++) {
            output.append('\nMixin ' + i + '\n')
            let mixinId = '0x' + ('00000000' + mixins[i].getMixinId().toString(16)).slice(-8)
            output.append('mixinId: ' + mixinId + '\n')

            let mixinPayload = mixins[i].getPayload()

            switch (mixinId) {
              case '0x51c32e3a':
                output.append('Mixin type: Mixin type\n')
                break

              case '0x9bc7a0e6':
                output.append('Mixin type: Language\n')
                let languageMessage = LanguageMixinProto.LanguageMixin.deserializeBinary(mixinPayload)
                output.appendChild(document.createTextNode('Language tag: '  + languageMessage.getLanguageTag() + '\n'))
                break

              case '0x344f4812':
                output.append('Mixin type: Title\n')
                let titleMessage = TitleMixinProto.TitleMixin.deserializeBinary(mixinPayload)
                output.appendChild(document.createTextNode('Title: '  + titleMessage.getTitle() + '\n'))
                break

              case '0x2d382044':
                output.append('Mixin type: Body text\n')
                let bodyTextMessage = BodyTextMixinProto.BodyTextMixin.deserializeBinary(mixinPayload)
                output.appendChild(document.createTextNode('Body text:\n'  + bodyTextMessage.getBodyText() + '\n'))
                break

              case '0xcdce4e5d':
                output.append('Mixin type: Mixin Schema\n')
                let mixinSchemaMessage = MixinSchemaMixinProto.MixinSchemaMixin.deserializeBinary(mixinPayload)
                output.appendChild(document.createTextNode('Mixin schema:\n'  + mixinSchemaMessage.getMixinSchema() + '\n'))
                break

              case '0x69a84d87':
                output.append('Mixin type: Image\n')
                let imageMessage = ImageMixinProto.ImageMixin.deserializeBinary(mixinPayload)
                let width = imageMessage.getWidth()
                output.append('Original width: ' + width + '\n')
                let height = imageMessage.getHeight()
                output.append('Original height: ' + height + '\n')
                let mipmaps = imageMessage.getMipmapLevelList()
                output.append('Mipmap levels: ' + mipmaps.length + '\n')
                let renderHeight = Math.round(256 * height / width)
                for (let j = 0; j < mipmaps.length; j++) {
                  output.append('\nMipmap level: ' + j + '\n')
                  output.append('Mipmap filesize: ' + formatByteCount(mipmaps[j].getFilesize()) + '\n')
                  let el = document.createElement('img')
                  let domString = '<img src="http://127.0.0.1:5102/ipfs/' + Base58.encode(mipmaps[j].getIpfsHash()) + '" width="256" height="' + renderHeight + '" style="display: block;">'
                  el.innerHTML = domString
                  output.appendChild(el.firstChild)
                }
                break

              case '0xbcec8faa':
                output.append('Mixin type: Topic Feed\n')
                break
            }
          }
        }
      }
    }
  }
</script>
