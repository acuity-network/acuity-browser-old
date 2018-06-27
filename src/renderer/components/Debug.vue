<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">Debug</h1>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <b-field label="itemId">
            <b-input id="itemId" autocomplete="off" inputmode="verbatim" placeholder="0x0000000000000000000000000000000000000000000000000000000000000000" spellcheck="false" size="66" style="font-family: monospace;"></b-input>
          </b-field>

          <button class="button is-primary" v-on:click="read">Read item</button>
        </div>
      </section>
      <section class="section">
        <div class="container">
          <code id="output" style="display: block; white-space: pre;"></code>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
  import itemProto from '../item_pb.js'
  import languageProto from '../language_pb.js'
  import titleProto from '../title_pb.js'
  import bodyTextProto from '../body_pb.js'
  import descriptionProto from '../description_pb.js'
  import jpegImageProto from '../jpeg-image_pb.js'
  const Base58 = require("base-58")

  export default {
    name: 'debug',
    components: {},
    methods: {
      read (event) {
        const output = document.getElementById('output')
        output.innerHTML = '';
        const itemId = document.getElementById('itemId').value

        const itemStoreShortIdAbi = require('./ItemStoreShortId.abi.json')
        const itemStoreShortId = new this.$web3.eth.Contract(itemStoreShortIdAbi, '0xd02ee768718b41a8cea9350d7c4c443727da5c7b')

        itemStoreShortId.methods.getShortId(itemId).call()
        .then(shortId => {
          output.appendChild(document.createTextNode('shortId: '  + shortId + '\n'))

          const itemStoreRegistryAbi = require('./ItemStoreRegistry.abi.json')
          const itemStoreRegistry = new this.$web3.eth.Contract(itemStoreRegistryAbi, '0xa46adddd3105715fa0ea0d4a883d4be99452c3f6')

          itemStoreRegistry.methods.getItemStore(itemId).call()
          .then(itemStoreAddress => {
            output.appendChild(document.createTextNode('itemStoreAddress: '  + itemStoreAddress + '\n'))

            const itemStoreAbi = require('./ItemStoreInterface.abi.json')
            const itemStore = new this.$web3.eth.Contract(itemStoreAbi, itemStoreAddress)

            itemStore.methods.getInUse(itemId).call()
            .then(inUse => {
              if (!inUse) {
                output.append('Item not found.\n')
                return;
              }

              itemStore.methods.getContractId().call()
              .then(contractId => {
                if (contractId != "0x2d54bddf4be19c6c") {
                  output.append('Unknown item store.\n')
                  return;
                }
                output.append('itemStore: ItemStoreIpfsSha256\n')

                const itemStoreIpfsSha256Abi = require('./ItemStoreIpfsSha256.abi.json')
                const itemStoreIpfsSha256 = new this.$web3.eth.Contract(itemStoreIpfsSha256Abi, itemStoreAddress)

                itemStoreIpfsSha256.methods.getItem(itemId).call()
                .then(item => {
                  output.append('Updatable: ' + ((item.flags & 0x01) ? 'true' : 'false') + '\n')
                  output.append('Enforce revisions: ' + ((item.flags & 0x02) ? 'true' : "false") + '\n')
                  output.append('Retractable: ' + ((item.flags & 0x04) ? 'true' : 'false') + '\n')
                  output.append('Transferable: ' + ((item.flags & 0x08) ? 'true' : 'false') + '\n')
                  output.append('Owner: ' + item.owner + '\n')
                  output.append('Revision count: ' + item.revisionCount + '\n')
                  output.append('Parent count: ' + item.parentIds.length + '\n')
                  output.append('Child count: ' + item.childIds.length + '\n\n')

                  for (var i = 0; i < item.parentIds.length; i++) {
                    output.append('Parent #' + i + ': ' + item.parentIds[i] + '\n')
                  }

                  for (var i = 0; i < item.childIds.length; i++) {
                    output.append('Child #' + i + ': ' + item.childIds[i] + '\n')
                  }

                  const timestamp = new Date(item.timestamps[0] * 1000)
                  output.append('\nRevision 0 timestamp: ' + timestamp + '\n')

                  const multihashes = require('multihashes')
                  const ipfsHash = multihashes.toB58String(multihashes.encode(Buffer.from(item.ipfsHashes[0].substr(2), "hex"), 'sha2-256'))
                  output.append('Revision 0 IPFS hash: ' + ipfsHash + '\n')

                  this.$http.get('http://127.0.0.1:5001/api/v0/cat?arg=/ipfs/' + ipfsHash)
                  .then(response => {
                    const containerPayload = new Uint8Array(Buffer.from(response.data, "binary"))
                    output.append('Compressed length: ' + containerPayload.length + '\n')

                    const itemPayload = this.$brotli.decompressArray(containerPayload)
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
                          break;

                        case '0x4e4e06c4':
                          output.append('Mixin type: Language\n')
                          var languageMessage = languageProto.LanguageMixin.deserializeBinary(mixinPayload)
                          output.appendChild(document.createTextNode('Language tag: '  + languageMessage.getLanguageTag() + '\n'))
                          break;

                        case '0x24da6114':
                          output.append('Mixin type: Title\n')
                          var titleMessage = titleProto.TitleMixin.deserializeBinary(mixinPayload)
                          output.appendChild(document.createTextNode('Title: '  + titleMessage.getTitle() + '\n'))
                          break;

                        case '0x34a9a6ec':
                          output.append('Mixin type: Body text\n')
                          var bodyTextMessage = bodyTextProto.BodyTextMixin.deserializeBinary(mixinPayload)
                          output.appendChild(document.createTextNode('Body text:\n'  + bodyTextMessage.getBodyText() + '\n'))
                          break;

                        case '0x5a474550':
                          output.append('Mixin type: Description\n')
                          var descriptionMessage = descriptionProto.DescriptionMixin.deserializeBinary(mixinPayload)
                          output.appendChild(document.createTextNode('Description:\n'  + descriptionMessage.getDescription() + '\n'))
                          break;

                        case '0x12745469':
                          output.append('Mixin type: Image\n')
                          var imageMessage = jpegImageProto.JpegMipmap.deserializeBinary(mixinPayload)
                          var width = imageMessage.getWidth()
                          output.append('Original width: ' + width + '\n')
                          var height = imageMessage.getHeight()
                          output.append('Original height: ' + height + '\n')
                          var mipmaps = imageMessage.getMipmapLevelList()
                          output.append('Mipmap levels: ' + mipmaps.length + '\n')
                          var renderHeight = Math.floor(256 * height / width)
                          for (var j = 0; j < mipmaps.length; j++) {
                            output.append('\nMipmap level: ' + j + '\n')
                            output.append('Mipmap filesize: ' + mipmaps[j].getFilesize() + '\n')
                            var el = document.createElement('img')
                            var domString = '<img src="http://localhost:8081/ipfs/' + Base58.encode(mipmaps[j].getIpfsHash()) + '" width="256" height="' + renderHeight + '" style="display: block;">'
                            el.innerHTML = domString
                            output.appendChild(el.firstChild)
                          }

                          break;

                        case '0xbcec8faa':
                          output.append('Mixin type: Topic Feed\n')
                          break;
                      }
                    }
                  })
                })
              })
            })
          })
        })
      }
    }
  }
</script>
