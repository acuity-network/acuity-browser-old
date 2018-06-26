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

          <button class="button" v-on:click="chooseFile">Choose image</button>
          <button class="button is-primary" v-on:click="publish">Publish</button>

        </div>
      </section>
    </main>
  </div>
</template>

<script>
  import axios from 'axios'
  import itemProto from '../item_pb.js'
  import languageProto from '../language_pb.js'
  import titleProto from '../title_pb.js'
  import bodyTextProto from '../body_pb.js'
  import descriptionProto from '../description_pb.js'
  import jpegImageProto from '../jpeg-image_pb.js'
  const Base58 = require("base-58")
  require('../brotli.js')
  const bro = new Brotli('/static/')

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
          window.fileNames = fileNames;
        })
      },
      publish (event) {
        const pica = require('pica')()
        function scaleImage(rawImageData, width, height) {
          return pica.resizeBuffer({
            src: rawImageData.data,
            width: rawImageData.width,
            height: rawImageData.height,
            toWidth: width,
            toHeight: height
          }).then(result => {
            rawImageData = {
              data: result,
              width: width,
              height: height
            }
            var jpegImageData = jpeg.encode(rawImageData, 70)

            var data = new FormData()
            data.append('', new File([jpegImageData.data], {type: 'application/octet-stream'}))

            return axios.post('http://127.0.0.1:5001/api/v0/add', data)
          })
        }

        console.log('Publishing Image.')
        console.log(window.fileNames[0])

        const fs = require('fs')
        const jpeg = require('jpeg-js')
        var jpegData = fs.readFileSync(window.fileNames[0])
        var rawImageData = jpeg.decode(jpegData)

        var mipmaps = []
        var level = 1
        do {
          var scale = Math.pow(2, level)
          var width = Math.floor(rawImageData.width / scale)
          var height = Math.floor(rawImageData.height / scale)
          console.log(level, width, height)
          mipmaps.push(scaleImage(rawImageData, width, height))
          level++
        }
        while (width > 64 && height > 64)

        Promise.all(mipmaps).then(mipmaps => {
          var imageMessage = new jpegImageProto.JpegMipmap()
          imageMessage.setWidth(rawImageData.width)
          imageMessage.setHeight(rawImageData.height)

          mipmaps.forEach(mipmap => {
            var mipmapLevelMessage = new jpegImageProto.MipmapLevel()
            mipmapLevelMessage.setFilesize(mipmap.data.Size)
            mipmapLevelMessage.setIpfsHash(Base58.decode(mipmap.data.Hash))
            imageMessage.addMipmapLevel(mipmapLevelMessage)
          })

          var itemMessage = new itemProto.Item()

          // Image
          var mixinMessage = new itemProto.Mixin()
          mixinMessage.setMixinId(0x12745469)
          mixinMessage.setPayload(imageMessage.serializeBinary())
          itemMessage.addMixin(mixinMessage)

          // Language
          var languageMessage = new languageProto.LanguageMixin()
          languageMessage.setLanguageTag('en-US');

          mixinMessage = new itemProto.Mixin()
          mixinMessage.setMixinId(0x4e4e06c4)
          mixinMessage.setPayload(languageMessage.serializeBinary())
          itemMessage.addMixin(mixinMessage)

          // Title
          var title = document.getElementById('title').value
          console.log(title)

          var titleMessage = new titleProto.TitleMixin()
          titleMessage.setTitle(title)

          mixinMessage = new itemProto.Mixin()
          mixinMessage.setMixinId(0x24da6114)
          mixinMessage.setPayload(titleMessage.serializeBinary())
          itemMessage.addMixin(mixinMessage)

          // Description
          var description = document.getElementById('description').value
          console.log(description)

          var descriptionMessage = new descriptionProto.DescriptionMixin()
          descriptionMessage.setDescription(description)

          mixinMessage = new itemProto.Mixin()
          mixinMessage.setMixinId(0x5a474550)
          mixinMessage.setPayload(descriptionMessage.serializeBinary())
          itemMessage.addMixin(mixinMessage)

          var itemPayload = itemMessage.serializeBinary()
          console.log(itemPayload)

          var output = bro.compressArray(itemPayload, 11)
          console.log(output)

          var data = new FormData()
          data.append('', new File([Buffer.from(output).toString('binary')], {type: 'application/octet-stream'}))

          var hashHex;

          // Send a POST request
          axios.post('http://127.0.0.1:5001/api/v0/add', data)
            .then(response => {
              var hash = response.data.Hash
              console.log(hash)

              const multihash = require('multihashes');
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
              const itemStoreIpfsSha256Abi = require('./ItemStoreIpfsSha256.abi.json')
              const itemStoreIpfsSha256 = new this.$web3.eth.Contract(itemStoreIpfsSha256Abi, '0xe059665fe0d226f00c72e3982d54bddf4be19c6c')

              var flagsNonce = '0x00' + this.$web3.utils.randomHex(30).substr(2)
              console.log(flagsNonce)
              account.call(itemStoreIpfsSha256.methods.getNewItemId(flagsNonce), 32).then(itemId => {
                console.log(itemId)

                account.send(itemStoreIpfsSha256.methods.create(flagsNonce, hashHex), 0, 0)
                this.$router.push({ name: 'item', params: { itemId: itemId }})
              })
            })
            .catch(error => {
              console.log(error)
            })
          })
      }
    },
    data () {
      return {
        electron: this.$web3.version
      }
    }
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
