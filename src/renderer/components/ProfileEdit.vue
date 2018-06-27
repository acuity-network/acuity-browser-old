<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">Edit Profile</h1>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">

          <b-field label="Name">
            <b-input id="name" :value="name"></b-input>
          </b-field>

          <b-field label="Type">
            <b-select id="type" :value="type">
              <option value="0">Anon</option>
              <option value="1">Person</option>
              <option value="2">Project</option>
              <option value="3">Organization</option>
              <option value="4">Proxy</option>
              <option value="5">Parody</option>
              <option value="6">Bot</option>
            </b-select>
          </b-field>

          <b-field label="Location">
            <b-input id="location" :value="location"></b-input>
          </b-field>

          <b-field label="Bio">
            <b-input id="bio" type="textarea" :value="bio"></b-input>
          </b-field>

          <b-field label="Image">
            <button class="button" v-on:click="chooseFile">Choose image</button>
          </b-field>

          <button class="button is-primary" v-on:click="publish">Publish</button>

        </div>
      </section>
    </main>
  </div>
</template>

<script>
  import itemProto from '../item_pb.js'
  import profileProto from '../account-profile_pb.js'
  import titleProto from '../title_pb.js'
  import bodyTextProto from '../body_pb.js'
  const multihash = require('multihashes')
  import MixItem from './mix_item.js'
  import Image from './image.js'

  export default {
    name: 'profile',
    components: {},
    asyncComputed: {
      name() {
        return this.$accountProfile.methods.getProfile().call()
        .then(itemId => {
          var item = new MixItem(itemId)
          return item.init()
        })
        .then(item => {
          return item.latestRevision().load()
        })
        .then(revision => {
          return revision.getTitle()
        })
      },
      bio() {
        return this.$accountProfile.methods.getProfile().call()
        .then(itemId => {
          var item = new MixItem(itemId)
          return item.init()
        })
        .then(item => {
          return item.latestRevision().load()
        })
        .then(revision => {
          return revision.getBodyText()
        })
      },
      location() {
        return this.$accountProfile.methods.getProfile().call()
        .then(itemId => {
          var item = new MixItem(itemId)
          return item.init()
        })
        .then(item => {
          return item.latestRevision().load()
        })
        .then(revision => {
          return revision.getProfile()
        })
        .then(result => {
          return result.location
        })
      },
      type() {
        return this.$accountProfile.methods.getProfile().call()
        .then(itemId => {
          var item = new MixItem(itemId)
          return item.init()
        })
        .then(item => {
          return item.latestRevision().load()
        })
        .then(revision => {
          return revision.getProfile()
        })
        .then(result => {
          return result.type
        })
      }
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

        // Account profile
        var profileMessage = new profileProto.AccountProfile()
        profileMessage.setType(document.getElementById('type').value)
        profileMessage.setLocation(document.getElementById('location').value)

        var mixinMessage = new itemProto.Mixin()
        mixinMessage.setMixinId(0x4bf3ce07)
        mixinMessage.setPayload(profileMessage.serializeBinary())
        itemMessage.addMixin(mixinMessage)

        // Title
        var titleMessage = new titleProto.TitleMixin()
        titleMessage.setTitle(document.getElementById('name').value)

        mixinMessage = new itemProto.Mixin()
        mixinMessage.setMixinId(0x24da6114)
        mixinMessage.setPayload(titleMessage.serializeBinary())
        itemMessage.addMixin(mixinMessage)

        // BodyText
        var bodyTextMessage = new bodyTextProto.BodyTextMixin()
        bodyTextMessage.setBodyText(document.getElementById('bio').value)

        mixinMessage = new itemProto.Mixin()
        mixinMessage.setMixinId(0x34a9a6ec)
        mixinMessage.setPayload(bodyTextMessage.serializeBinary())
        itemMessage.addMixin(mixinMessage)

        // Image
        var image = new Image(this, window.fileNames[0])
        image.createMixin()
        .then(imageMixin => {
          itemMessage.addMixin(imageMixin)

          var itemPayload = itemMessage.serializeBinary()
          var output = this.$brotli.compressArray(itemPayload, 11)

          var data = new FormData()
          data.append('', new File([Buffer.from(output).toString('binary')], {type: 'application/octet-stream'}))

          var hexHash

          // Publish to IPFS.
          this.$http.post('http://127.0.0.1:5001/api/v0/add', data)
          .then(response => {
            hexHash = '0x' + multihash.decode(multihash.fromB58String(response.data.Hash)).digest.toString('hex')
            return this.$accountProfile.methods.getProfile().call()
          })
          .then(itemId => {
            console.log(itemId)
            this.$itemStoreIpfsSha256.methods.createNewRevision(itemId, hexHash).send({
              from: '0xe58b128142a5e94b169396dd021f5f02fa38b3b0',
              gas: 1000000,
              gasPrice: 1
            })
            router.push({ name: 'profile' })
          })
          .catch(err => {
            console.log('No profile item found, creating new one.')
            var flagsNonce = '0x01' + this.$web3.utils.randomHex(30).substr(2)
            this.$web3.eth.getTransactionCount('0xe58b128142a5e94b169396dd021f5f02fa38b3b0')
            .then (nonce => {
              this.$itemStoreIpfsSha256.methods.getNewItemId(flagsNonce).call()
              .then(itemId => {
                this.$itemStoreIpfsSha256.methods.create(flagsNonce, hexHash).send({
                  from: '0xe58b128142a5e94b169396dd021f5f02fa38b3b0',
                  gas: 1000000,
                  gasPrice: 1,
                  nonce: nonce
                }).then(result => {
                  console.log(result)
                })
                this.$accountProfile.methods.setProfile(itemId).send({
                  from: '0xe58b128142a5e94b169396dd021f5f02fa38b3b0',
                  gas: 1000000,
                  gasPrice: 1,
                  nonce: nonce + 1
                }).then(result => {
                  console.log(result)
                })
              })
            })
          })
        })
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
