<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <h1 class="title">Edit Profile</h1>
        </div>
      </section>

      <section class="section">
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
      </section>
    </main>
  </div>
</template>

<script>
  import itemProto from '../../lib/item_pb.js'
  import profileProto from '../../lib/account-profile_pb.js'
  import titleProto from '../../lib/title_pb.js'
  import bodyTextProto from '../../lib/body_pb.js'
  const multihash = require('multihashes')
  import MixItem from '../../lib/MixItem.js'
  import Image from '../../lib/Image.js'

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
    created() {
      if (!window.activeAccount) {
        return
      }
      window.activeAccount.call(this.$accountProfile.methods.getProfile())
      .then(itemId => {
        var item = new MixItem(this, itemId)

        item.init()
        .then(item => {
          return item.latestRevision().load()
        })
        .then(revision => {
          this.name = revision.getTitle()
          this.bio = revision.getBodyText()
          var profile = revision.getProfile()
          this.type = profile.type
          this.location = profile.location
        })
      })
      .catch(error => {
        console.log(error)
      })
    },
    methods: {
      chooseFile (event) {
        const {dialog} = require('electron').remote
        dialog.showOpenDialog({
          title: 'Choose image',
          filters: [{name: 'Images', extensions: ['webp', 'jpg', 'jpeg', 'png', 'gif', 'tiff', 'svg', 'svgz', 'ppm']}],
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
        Promise.all(promises)
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
          return window.activeAccount.call(this.$accountProfile.methods.getProfile())
        })
        .then(itemId => {
          window.activeAccount.sendData(this.$itemStoreIpfsSha256.methods.createNewRevision(itemId, hexHash), 0, 'Update profile')
          .then(() => {
            this.$router.push({ name: 'profile' })
          })
        })
        .catch(err => {
          var flagsNonce = '0x01' + this.$web3.utils.randomHex(30).substr(2)
          window.activeAccount.call(this.$itemStoreIpfsSha256.methods.getNewItemId(flagsNonce))
          .then(itemId => {
            window.activeAccount.sendData(this.$itemStoreIpfsSha256.methods.create(flagsNonce, hexHash), 0, 'Create profile item')
            .then(result => {
              return window.activeAccount.sendData(this.$accountProfile.methods.setProfile(itemId), 0, 'Set profile item')
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

  button {
    font-weight: bold;
  }

</style>
