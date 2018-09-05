<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <h1 class="title">Publish Mixin type</h1>
        </div>
      </section>

      <section class="section">
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
      </section>
    </main>
  </div>
</template>

<script>
  export default {
    name: 'publish-mixin-type',
    components: {},
    methods: {
      publish (event) {
        var itemMessage = new this.$itemProto.Item()

        // Mixin type
        var mixinMessage = new this.$itemProto.Mixin()
        mixinMessage.setMixinId(0x51c32e3a)
        itemMessage.addMixin(mixinMessage)

        // Language
        var languageMessage = new this.$languageProto.LanguageMixin()
        languageMessage.setLanguageTag('en-US')

        mixinMessage = new this.$itemProto.Mixin()
        mixinMessage.setMixinId(0x4e4e06c4)
        mixinMessage.setPayload(languageMessage.serializeBinary())
        itemMessage.addMixin(mixinMessage)

        // Title
        var titleMessage = new this.$titleProto.TitleMixin()
        titleMessage.setTitle(document.getElementById('title').value)

        mixinMessage = new this.$itemProto.Mixin()
        mixinMessage.setMixinId(0x24da6114)
        mixinMessage.setPayload(titleMessage.serializeBinary())
        itemMessage.addMixin(mixinMessage)

        // Schema
        if (schema.length > 0) {
          var bodyTextMessage = new this.$bodyTextProto.BodyTextMixin()
          bodyTextMessage.setBodyText(document.getElementById('schema').value)

          mixinMessage = new this.$itemProto.Mixin()
          mixinMessage.setMixinId(0x34a9a6ec)
          mixinMessage.setPayload(bodyTextMessage.serializeBinary())
          itemMessage.addMixin(mixinMessage)
        }

        // Description
        var descriptionMessage = new this.$descriptionProto.DescriptionMixin()
        descriptionMessage.setDescription(document.getElementById('description').value)

        mixinMessage = new this.$itemProto.Mixin()
        mixinMessage.setMixinId(0x5a474550)
        mixinMessage.setPayload(descriptionMessage.serializeBinary())
        itemMessage.addMixin(mixinMessage)

        var itemPayload = itemMessage.serializeBinary()
        var output = this.$brotli.compressArray(itemPayload, 11)
        var data = new FormData()
        data.append('', new File([Buffer.from(output).toString('binary')], {type: 'application/octet-stream'}))

        // Send a POST request
        this.$http.post('http://127.0.0.1:5001/api/v0/add', data)
        .then(response => {
          var hash = response.data.Hash
          const multihash = require('multihashes')
          var decodedHash = multihash.decode(multihash.fromB58String(hash))
          if (decodedHash.name != 'sha2-256') {
            throw 'Wrong type of multihash.'
          }

          var hashHex = '0x' + decodedHash.digest.toString('hex')
          var flagsNonce = '0x00' + this.$web3.utils.randomHex(30).substr(2)
          window.activeAccount.call(this.$itemStoreIpfsSha256.methods.getNewItemId(flagsNonce))
          .then(itemId => {
            window.activeAccount.sendData(this.$itemStoreShortId.methods.createShortId(itemId), 0, 'Create short ID')
            .then(() => {
              return window.activeAccount.sendData(this.$itemStoreIpfsSha256.methods.create(flagsNonce, hashHex), 0, 'Create mixin type')
            })
            .then(() => {
              this.$router.push({ name: 'item', params: { itemId: itemId }})
            })
          })
        })
        .catch(error => {
          console.log(error)
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
