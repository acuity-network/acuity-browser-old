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
              <option value="7">Shill</option>
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
  import MixAccount from '../../lib/MixAccount.js'

  export default {
    name: 'profile',
    components: {},
    data() {
      return {
        name: '',
        bio: '',
        location: '',
        type: '',
      }
    },
    beforeRouteEnter (to, from, next) {
      next(vm => {
        var account = new MixAccount(vm, vm.$web3.eth.defaultAccount)
        account.init()
        .then(() => {
          return account.call(vm.$accountProfile.methods.getProfile())
        })
        .then(itemId => {
          var item = new MixItem(vm, itemId)

          item.init()
          .then(item => {
            return item.revisions[0].load()
          })
          .then(revision => {
            vm.name = revision.getTitle()
            vm.bio = revision.getBodyText()
            var profile = revision.getProfile()
            vm.type = profile.type
            vm.location = profile.location
          })
        })
        .catch(error => {
          console.log(error)
        })
      })
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
        var promises = []
        if (window.fileNames) {
          var image = new Image(this, window.fileNames[0])
          promises.push(image.createMixin()
            .then(imageMixin => {
              itemMessage.addMixin(imageMixin)
            })
          )
        }

        var hexHash
        var account = new MixAccount(this, this.$web3.eth.defaultAccount)
        account.init()
        .then ( () => {
          return Promise.all(promises)
        })
        .then ( () => {
          var itemPayload = itemMessage.serializeBinary()
          var output = this.$brotli.compressArray(itemPayload, 11)

          // Publish to IPFS.
          var data = new FormData()
          data.append('', new File([Buffer.from(output).toString('binary')], {type: 'application/octet-stream'}))
          return this.$http.post('http://127.0.0.1:5001/api/v0/add', data)
        })
        .then(response => {
          hexHash = '0x' + multihash.decode(multihash.fromB58String(response.data.Hash)).digest.toString('hex')
          return account.call(this.$accountProfile.methods.getProfile())
        })
        .then(itemId => {
          account.sendData(this.$itemStoreIpfsSha256.methods.createNewRevision(itemId, hexHash))
          .then(() => {
            this.$router.push({ name: 'profile' })
          })
        })
        .catch(err => {
          console.log('No profile item found, creating new one.')
          var flagsNonce = '0x01' + this.$web3.utils.randomHex(30).substr(2)
          account.call(this.$itemStoreIpfsSha256.methods.getNewItemId(flagsNonce))
          .then(itemId => {
            account.sendData(this.$itemStoreIpfsSha256.methods.create(flagsNonce, hexHash))
            .then(result => {
              return account.sendData(this.$accountProfile.methods.setProfile(itemId))
            })
            .then(() => {
              this.$router.push({ name: 'profile' })
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
