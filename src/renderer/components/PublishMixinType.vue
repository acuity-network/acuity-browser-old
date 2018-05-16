<template>
  <div id="wrapper">
    <main>
      <h1>Publish Mixin Type</h1>
      <textarea id="schema" rows="20"></textarea>
      <button v-on:click="publish">Publish Mixin Type</button>
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
        console.log(this.$web3.version)
        var schema = document.getElementById('schema').value
        console.log(schema)

        var mixinMixin = new this.$mixinProto.MixinMixin()
        mixinMixin.setSchema(schema)
        var mixinPayload = mixinMixin.serializeBinary()
        console.log(mixinPayload)

        var mixinMessage = new this.$itemProto.Mixin()
        mixinMessage.setMixinId(0)
        mixinMessage.setPayload(mixinPayload)

        var itemMessage = new this.$itemProto.Item()
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
            var hash = response.data.Hash;
            console.log(hash);
          })
          .catch(function (error) {
            console.log(error);
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

  body {
    font-family: 'OpenSans', 'sans-serif';
    font-weight: 300;
  }

  textarea {
    width: 98%;
    display: block;
  }

</style>
