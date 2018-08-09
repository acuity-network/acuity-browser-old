<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">{{ title }}</h1>
            <h2 class="subtitle">by {{ owner }}</h2>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <span v-html="body"></span>
          <div class="bodyText">{{ description }}</div>
        </div>
        <div class="container">
          <comment v-for="childId in childIds" v-bind:itemId="childId"></comment>
        </div>
      </section>

      <section class="section">
        <div class="container">

          <b-field label="Comment">
            <b-input v-model="comment" type="textarea"></b-input>
          </b-field>

          <button class="button is-primary" v-on:click="publish">Publish</button>

        </div>
      </section>
    </main>
  </div>
</template>

<script>
  import MixItem from '../../lib/MixItem.js'
  import Comment from './Comment.vue'

  export default {
    name: 'view-item',
    components: {
      Comment,
    },
    data() {
      return {
        title: '',
        owner: '',
        body: '',
        description: '',
        childIds: [],
        comment: '',
      }
    },
    created() {
      this.loadData()
    },
    methods: {
      loadData() {
        var item = new MixItem(this.$root, this.$route.params.itemId)

        return item.init()
        .then(item => {
          item.account()
          .then(account => {
            return account.call(this.$accountProfile.methods.getProfile())
          })
          .then(profileItemId => {
            return new MixItem(this.$root, profileItemId).init()
          })
          .then(profileItem => {
            return profileItem.latestRevision().load()
          })
          .then(profileRevision => {
            this.owner = profileRevision.getTitle()
          })
          .catch(() => {})
          this.childIds = item.childIds()
          return item.latestRevision().load()
        })
        .then(revision => {
          this.title = revision.getTitle()
          this.body = revision.getImage(512)
          this.description = revision.getDescription()

          var id
          this.$db.get('/historyCount')
          .then(count => {
            id = parseInt(count)
          })
          .catch(err => {
            id = 0
          })
          .then(() => {
            return this.$db.get('/historyIndex/' + this.$route.params.itemId)
            .then(id => {
              this.$db.del('/history/' + id)
            })
            .catch(err => {})
          })
          .then(() => {
            this.$db.batch()
            .put('/history/' + id, JSON.stringify({
              itemId: this.$route.params.itemId,
              timestamp: Date.now(),
              title: this.title,
            }))
            .put('/historyIndex/' + this.$route.params.itemId, id)
            .put('/historyCount', id + 1)
            .write()
          })
        })
      },
      publish (event) {
        var itemMessage = new this.$itemProto.Item()

        // Mixin type
        var mixinMessage = new this.$itemProto.Mixin()
        mixinMessage.setMixinId(0x874aba65)
        itemMessage.addMixin(mixinMessage)

        // BodyText
        var bodyTextMessage = new this.$bodyTextProto.BodyTextMixin()
        bodyTextMessage.setBodyText(this.comment)
        mixinMessage = new this.$itemProto.Mixin()
        mixinMessage.setMixinId(0x34a9a6ec)
        mixinMessage.setPayload(bodyTextMessage.serializeBinary())
        itemMessage.addMixin(mixinMessage)

        var itemPayload = itemMessage.serializeBinary()
        var output = this.$brotli.compressArray(itemPayload, 11)
        var data = new FormData()
        data.append('', new File([Buffer.from(output).toString('binary')], {type: 'application/octet-stream'}))
        var hashHex
        // Send a POST request
        this.$http.post('http://127.0.0.1:5001/api/v0/add', data)
        .then(response => {
          const multihash = require('multihashes')
          var decodedHash = multihash.decode(multihash.fromB58String(response.data.Hash))

          if (decodedHash.name != 'sha2-256') {
            throw 'Wrong type of multihash.'
          }

          hashHex = '0x' + decodedHash.digest.toString('hex')
          var flagsNonce = '0x00' + this.$web3.utils.randomHex(30).substr(2)
          return window.activeAccount.call(this.$itemStoreIpfsSha256.methods.getNewItemId(flagsNonce))
          .then(itemId => {
            return window.activeAccount.sendData(this.$itemStoreIpfsSha256.methods.createWithParent(flagsNonce, hashHex, this.$route.params.itemId), 0, 'Post comment')
          })
          .then(() => {
            this.loadData()
          })
        })
      }
    },
  }
</script>

<style>

  body {
    font-family: 'OpenSans', 'sans-serif';
  }

</style>
