<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">Publish Image</h1>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">

          <b-field label="Title">
            <b-input id="title"></b-input>
          </b-field>

          <b-field label="Description">
            <b-input id="description" type="textarea"></b-input>
          </b-field>

          <b-field label="Parent itemId">
            <b-input id="parentId" autocomplete="off" inputmode="verbatim" placeholder="0x0000000000000000000000000000000000000000000000000000000000000000" spellcheck="false" size="66" style="font-family: monospace;"></b-input>
          </b-field>

          <button class="button" v-on:click="chooseFile">Choose image</button>
          <button class="button is-primary" v-on:click="publish">Publish</button>

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
  import Image from './image.js'
  import MixAccount from '../../lib/MixAccount.js'

  export default {
    name: 'publish-image',
    components: {},
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
        console.log(window.fileNames[0])

        var image = new Image(this, window.fileNames[0])
        image.createMixin()
        .then(imageMixin => {
          var itemMessage = new itemProto.Item()

          // Image
          itemMessage.addMixin(imageMixin)

          // Language
          var languageMessage = new languageProto.LanguageMixin()
          languageMessage.setLanguageTag('en-US')

          var mixinMessage = new itemProto.Mixin()
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

          var itemPayload = itemMessage.serializeBinary()
          console.log(itemPayload)

          var output = this.$brotli.compressArray(itemPayload, 11)
          console.log(output)

          var data = new FormData()
          data.append('', new File([Buffer.from(output).toString('binary')], {type: 'application/octet-stream'}))

          var hashHex

          // Send a POST request
          this.$http.post('http://127.0.0.1:5001/api/v0/add', data)
          .then(response => {
            var hash = response.data.Hash
            console.log(hash)

            const multihash = require('multihashes')
            var decodedHash = multihash.decode(multihash.fromB58String(hash))
            console.log(decodedHash)

            if (decodedHash.name != 'sha2-256') {
              throw 'Wrong type of multihash.'
            }

            hashHex = '0x' + decodedHash.digest.toString('hex')
            console.log(hashHex)

            var account = new MixAccount(this, this.$web3.eth.defaultAccount)
            return account.init()
          })
          .then (account => {
            var flagsNonce = '0x00' + this.$web3.utils.randomHex(30).substr(2)
            console.log(flagsNonce)
            account.call(this.$itemStoreIpfsSha256.methods.getNewItemId(flagsNonce))
            .then(itemId => {
              console.log(itemId)

              var parentId = document.getElementById('parentId').value

              if (parentId) {
                account.sendData(this.$itemStoreIpfsSha256.methods.createWithParent(flagsNonce, hashHex, parentId))
              }
              else {
                account.sendData(this.$itemStoreIpfsSha256.methods.create(flagsNonce, hashHex))
              }
              this.$router.push({ name: 'item', params: { itemId: itemId }})
            })
          })
          .catch(error => {
            console.log(error)
          })
        })
      }
    },
  }
</script>

<style>

  body, button {
    font-family: 'OpenSans', 'sans-serif';
  }

  button {
    font-weight: bold;
  }

</style>
