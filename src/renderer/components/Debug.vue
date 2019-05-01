<template>
  <page>
    <template slot="title">
      {{ $t('debug') }}
    </template>

    <template slot="body">
      <b-field :label="$t('itemId')">
        <b-input id="itemId" autocomplete="off" inputmode="verbatim" placeholder="0x0000000000000000000000000000000000000000000000000000000000000000" spellcheck="false" size="66" style="font-family: monospace;"></b-input>
      </b-field>

      <button class="button is-primary" v-on:click="read">{{ $t('readItem') }}</button>
      <code id="output" style="display: block; white-space: pre;"></code>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import itemProto from '../../lib/item_pb.js'
  import languageProto from '../../lib/language_pb.js'
  import titleProto from '../../lib/title_pb.js'
  import bodyTextProto from '../../lib/body_pb.js'
  import descriptionProto from '../../lib/description_pb.js'
  import jpegImageProto from '../../lib/jpeg-image_pb.js'
  let brotli = require('iltorb')
  const Base58 = require("base-58")

  export default {
    name: 'debug',
    components: {
      Page,
    },
    methods: {
      async read(event) {
        const output = document.getElementById('output')
        output.innerHTML = ''
        const itemId = document.getElementById('itemId').value

        let shortId = await this.$itemStoreShortId.methods.getShortId(itemId).call()
        output.appendChild(document.createTextNode('shortId: '  + shortId + '\n'))

        let itemStoreAddress = await this.$itemStoreRegistry.methods.getItemStore(itemId).call()
        output.appendChild(document.createTextNode('itemStoreAddress: '  + itemStoreAddress + '\n'))

        const itemStoreAbi = require('../../lib/ItemStoreInterface.abi.json')
        const itemStore = new this.$web3.eth.Contract(itemStoreAbi, itemStoreAddress)

        let inUse = await itemStore.methods.getInUse(itemId).call()
        if (!inUse) {
          output.append('Item not found.\n')
          return
        }

        let contractId = await itemStore.methods.getContractId().call()
        if (contractId != "0x1f1e136d1003177d") {
          output.append('Unknown item store.\n')
          return
        }
        output.append('itemStore: ItemStoreIpfsSha256\n')

        let item = await this.$itemStoreIpfsSha256.methods.getItem(itemId).call()
        output.append('Updatable: ' + ((item.flags & 0x01) ? 'true' : 'false') + '\n')
        output.append('Enforce revisions: ' + ((item.flags & 0x02) ? 'true' : "false") + '\n')
        output.append('Retractable: ' + ((item.flags & 0x04) ? 'true' : 'false') + '\n')
        output.append('Transferable: ' + ((item.flags & 0x08) ? 'true' : 'false') + '\n')
        output.append('Owner: ' + item.owner + '\n')
        output.append('Revision count: ' + item.revisionCount + '\n')

        for (var i = 0; i < item.revisionCount; i++) {
          const timestamp = new Date(item.timestamps[i] * 1000)
          output.append('\nRevision ' + i + ' timestamp: ' + timestamp + '\n')

          const multihashes = require('multihashes')
          const ipfsHash = multihashes.toB58String(multihashes.encode(Buffer.from(item.ipfsHashes[i].substr(2), "hex"), 'sha2-256'))
          output.append('Revision ' + i + ' IPFS hash: ' + ipfsHash + '\n')

          let response = await this.$ipfsClient.get('cat?arg=/ipfs/' + ipfsHash, false)
          const containerPayload = Buffer.from(response, "binary")
          output.append('Compressed length: ' + containerPayload.length + '\n')

          const itemPayload = await brotli.decompress(Buffer.from(containerPayload))
          output.append('Uncompressed length: ' + itemPayload.length + '\n')

          const itemMessage = itemProto.Item.deserializeBinary(itemPayload)
          const mixins = itemMessage.getMixinList()

          output.append('Mixin count: ' + mixins.length + '\n')

          for (var i = 0; i < mixins.length; i++) {
            output.append('\nMixin ' + i + '\n')
            var mixinId = '0x' + ('00000000' + mixins[i].getMixinId().toString(16)).slice(-8)
            output.append('mixinId: ' + mixinId + '\n')

            var mixinPayload = mixins[i].getPayload()

            switch (mixinId) {
              case '0x51c32e3a':
                output.append('Mixin type: Mixin type\n')
                break

              case '0x4e4e06c4':
                output.append('Mixin type: Language\n')
                var languageMessage = languageProto.LanguageMixin.deserializeBinary(mixinPayload)
                output.appendChild(document.createTextNode('Language tag: '  + languageMessage.getLanguageTag() + '\n'))
                break

              case '0x24da6114':
                output.append('Mixin type: Title\n')
                var titleMessage = titleProto.TitleMixin.deserializeBinary(mixinPayload)
                output.appendChild(document.createTextNode('Title: '  + titleMessage.getTitle() + '\n'))
                break

              case '0x34a9a6ec':
                output.append('Mixin type: Body text\n')
                var bodyTextMessage = bodyTextProto.BodyTextMixin.deserializeBinary(mixinPayload)
                output.appendChild(document.createTextNode('Body text:\n'  + bodyTextMessage.getBodyText() + '\n'))
                break

              case '0x5a474550':
                output.append('Mixin type: Description\n')
                var descriptionMessage = descriptionProto.DescriptionMixin.deserializeBinary(mixinPayload)
                output.appendChild(document.createTextNode('Description:\n'  + descriptionMessage.getDescription() + '\n'))
                break

              case '0x12745469':
                output.append('Mixin type: Image\n')
                var imageMessage = jpegImageProto.JpegMipmap.deserializeBinary(mixinPayload)
                var width = imageMessage.getWidth()
                output.append('Original width: ' + width + '\n')
                var height = imageMessage.getHeight()
                output.append('Original height: ' + height + '\n')
                var mipmaps = imageMessage.getMipmapLevelList()
                output.append('Mipmap levels: ' + mipmaps.length + '\n')
                var renderHeight = Math.round(256 * height / width)
                for (var j = 0; j < mipmaps.length; j++) {
                  output.append('\nMipmap level: ' + j + '\n')
                  output.append('Mipmap filesize: ' + mipmaps[j].getFilesize() + '\n')
                  var el = document.createElement('img')
                  var domString = '<img src="http://127.0.0.1:8080/ipfs/' + Base58.encode(mipmaps[j].getIpfsHash()) + '" width="256" height="' + renderHeight + '" style="display: block;">'
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
