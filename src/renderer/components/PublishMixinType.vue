<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">Publish Mixin Type</h1>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">

          <b-field label="Title">
            <b-input id="title"></b-input>
          </b-field>

          <b-field label="Schema">
            <b-input id="schema" type="textarea"></b-input>
          </b-field>

          <b-field label="Description">
            <b-input id="description" type="textarea"></b-input>
          </b-field>

          <b-field label="Parent itemId">
            <b-input id="parentId" autocomplete="off" inputmode="verbatim" placeholder="0x0000000000000000000000000000000000000000000000000000000000000000" spellcheck="false" size="66" style="font-family: monospace;"></b-input>
          </b-field>

          <button class="button is-primary" v-on:click="publish">Publish</button>

        </div>
      </section>
    </main>
  </div>
</template>

<script>
  export default {
    name: 'publish-mixin-type',
    components: {},
    methods: {
      publish: function (event) {
        // `this` inside methods points to the Vue instance
        console.log('Publishing mixin type.')

        var itemMessage = new this.$itemProto.Item()

        // Mixin type
        var mixinMessage = new this.$itemProto.Mixin()
        mixinMessage.setMixinId(0x51c32e3a)
        itemMessage.addMixin(mixinMessage)

        // Language
        var languageMessage = new this.$languageProto.LanguageMixin()
        languageMessage.setLanguageTag('en-US');

        mixinMessage = new this.$itemProto.Mixin()
        mixinMessage.setMixinId(0x4e4e06c4)
        mixinMessage.setPayload(languageMessage.serializeBinary())
        itemMessage.addMixin(mixinMessage)

        // Title
        var title = document.getElementById('title').value
        console.log(title)

        var titleMessage = new this.$titleProto.TitleMixin()
        titleMessage.setTitle(title)

        mixinMessage = new this.$itemProto.Mixin()
        mixinMessage.setMixinId(0x24da6114)
        mixinMessage.setPayload(titleMessage.serializeBinary())
        itemMessage.addMixin(mixinMessage)

        // Schema
        var schema = document.getElementById('schema').value
        console.log(schema)

        if (schema.length > 0) {
          var bodyTextMessage = new this.$bodyTextProto.BodyTextMixin()
          bodyTextMessage.setBodyText(schema)

          mixinMessage = new this.$itemProto.Mixin()
          mixinMessage.setMixinId(0x34a9a6ec)
          mixinMessage.setPayload(bodyTextMessage.serializeBinary())
          itemMessage.addMixin(mixinMessage)
        }

        // Description
        var description = document.getElementById('description').value
        console.log(description)

        var descriptionMessage = new this.$descriptionProto.DescriptionMixin()
        descriptionMessage.setDescription(description)

        mixinMessage = new this.$itemProto.Mixin()
        mixinMessage.setMixinId(0x5a474550)
        mixinMessage.setPayload(descriptionMessage.serializeBinary())
        itemMessage.addMixin(mixinMessage)

        var itemPayload = itemMessage.serializeBinary()
        console.log(itemPayload)

        var output = this.$bro.compressArray(itemPayload, 11)
        console.log(output)

        var data = new FormData()
        data.append('', new File([Buffer.from(output).toString('binary')], {type: 'application/octet-stream'}))

        // Send a POST request
        this.$http.post('http://127.0.0.1:5001/api/v0/add', data)
          .then(function (response) {
            var hash = response.data.Hash
            console.log(hash)

            const multihash = require('multihashes');
            var decodedHash = multihash.decode(multihash.fromB58String(hash))
            console.log(decodedHash)

            if (decodedHash.name != 'sha2-256') {
              throw 'Wrong type of multihash.'
            }

            var hashHex = '0x' + decodedHash.digest.toString('hex')
            console.log(hashHex)

            const Web3 = require('web3')
            var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8645'))
            web3.eth.defaultAccount = '0xe58b128142a5e94b169396dd021f5f02fa38b3b0'


            const itemStoreIpfsSha256Abi = require('./ItemStoreIpfsSha256.abi.json')
            const itemStoreIpfsSha256 = new web3.eth.Contract(itemStoreIpfsSha256Abi, '0xe059665fe0d226f00c72e3982d54bddf4be19c6c')

            var flagsNonce = '0x00' + web3.utils.keccak256(Math.random().toString()).substr(4)
            console.log(flagsNonce)
            itemStoreIpfsSha256.methods.getNewItemId(flagsNonce).call().then(function(itemId) {
              console.log(itemId)

              const itemStoreShortIdAbi = require('./ItemStoreShortId.abi.json')
              const itemStoreShortId = new web3.eth.Contract(itemStoreShortIdAbi, '0xd02ee768718b41a8cea9350d7c4c443727da5c7b')

              itemStoreShortId.methods.createShortId(itemId).send({from: '0xe58b128142a5e94b169396dd021f5f02fa38b3b0'}).then(function(shortId) {
                console.log(shortId)
              })

              itemStoreIpfsSha256.methods.create(flagsNonce, hashHex).send({
                from: '0xe58b128142a5e94b169396dd021f5f02fa38b3b0',
                gas: 1000000
              }).then(function(result) {
                console.log(result)
              })

            })
          })
          .catch(function (error) {
            console.log(error)
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
