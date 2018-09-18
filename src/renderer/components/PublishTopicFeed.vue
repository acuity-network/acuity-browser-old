<template>
  <page>
    <template slot="title">
      Publish Topic Feed
    </template>

    <template slot="body">
      <b-field label="Title">
        <b-input id="title"></b-input>
      </b-field>

      <b-field label="Description">
        <b-input id="description" type="textarea"></b-input>
      </b-field>

      <button class="button" v-on:click="chooseFile">Choose image</button>
      <button class="button is-primary" v-on:click="publish">Publish</button>
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

  export default {
    name: 'publish-image',
    components: {
      Page,
    },
    methods: {
      chooseFile (event) {
        const {dialog} = require('electron').remote
        dialog.showOpenDialog({
          title: 'Choose image',
          filters: [{name: 'Images', extensions: ['jpg', 'png', 'gif']}]
        }, (fileNames) => {
          window.fileNames = fileNames
        })
      },
      publish (event) {

        var itemMessage = new itemProto.Item()

        // Topic
        var mixinMessage = new itemProto.Mixin()
        mixinMessage.setMixinId(0xbcec8faa)
        itemMessage.addMixin(mixinMessage)

        // Language
        var languageMessage = new languageProto.LanguageMixin()
        languageMessage.setLanguageTag('en-US')

        mixinMessage = new itemProto.Mixin()
        mixinMessage.setMixinId(0x4e4e06c4)
        mixinMessage.setPayload(languageMessage.serializeBinary())
        itemMessage.addMixin(mixinMessage)

        // Title
        var titleMessage = new titleProto.TitleMixin()
        titleMessage.setTitle(document.getElementById('title').value)

        mixinMessage = new itemProto.Mixin()
        mixinMessage.setMixinId(0x24da6114)
        mixinMessage.setPayload(titleMessage.serializeBinary())
        itemMessage.addMixin(mixinMessage)

        // Description
        var descriptionMessage = new descriptionProto.DescriptionMixin()
        descriptionMessage.setDescription(document.getElementById('description').value)

        mixinMessage = new itemProto.Mixin()
        mixinMessage.setMixinId(0x5a474550)
        mixinMessage.setPayload(descriptionMessage.serializeBinary())
        itemMessage.addMixin(mixinMessage)

        // Image
        if (window.fileNames) {
          var image = new Image(this, window.fileNames[0])
          image.createMixin()
          .then(imageMixin => {
            itemMessage.addMixin(imageMixin)
          })
        }

        var itemPayload = itemMessage.serializeBinary()
        var output = this.$brotli.compressArray(itemPayload, 11)
        var data = new FormData()
        data.append('', new File([Buffer.from(output).toString('binary')], {type: 'application/octet-stream'}))

        var hashHex

        // Send a POST request
        this.$http.post('http://127.0.0.1:5001/api/v0/add', data)
        .then(response => {
          var hash = response.data.Hash
          const multihash = require('multihashes')
          var decodedHash = multihash.decode(multihash.fromB58String(hash))
          if (decodedHash.name != 'sha2-256') {
            throw 'Wrong type of multihash.'
          }

          hashHex = '0x' + decodedHash.digest.toString('hex')
          var flagsNonce = '0x00' + this.$web3.utils.randomHex(30).substr(2)
          window.activeAccount.call(this.$itemStoreIpfsSha256.methods.getNewItemId(flagsNonce), 32).then(itemId => {
            window.activeAccount.sendData(this.$itemStoreIpfsSha256.methods.create(flagsNonce, hashHex), 0, 'Creating Topic Feed item.')
            this.$router.push({ name: 'item', params: { itemId: itemId }})
          })
        })
        .catch(error => {
          console.log(error)
        })
      }
    },
  }
</script>
