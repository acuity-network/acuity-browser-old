<template>
  <page>
    <template slot="title">
      {{ title }}
    </template>

    <template slot="subtitle">
      by <router-link :to="ownerRoute">{{ owner }}</router-link>&ensp;
      <span
        v-on:mouseover="ownerTrustedClassCurrent = ownerTrustedClassHover"
        v-on:mouseleave="ownerTrustedClassCurrent = ownerTrustedClass"
        :class="ownerTrustedClassCurrent" class="shield mdi mdi-24px"
        v-on:click="toggleTrust"></span><br />
        {{ timestamp }}
    </template>

    <template slot="body">
      <div class="image" v-html="body"></div>
      <div class="bodyText">{{ description }}</div>

      <div v-if="isProfile">
        <b-field label="Trusted that trust">
          <profile-link v-for="address in trustedThatTrust" v-bind:address="address"></profile-link>
        </b-field>
      </div>

      <comment v-for="childId in childIds" v-bind:itemId="childId"></comment>

      <b-input v-model="reply" type="textarea"></b-input>
      <button class="button is-primary" v-on:click="publishReply">Reply</button>
    </template>
  </page>
</template>

<script>
  import MixItem from '../../lib/MixItem.js'
  import Comment from './Comment.vue'
  import ProfileLink from './ProfileLink.vue'
  import Page from './Page.vue'

  export default {
    name: 'view-item',
    props: ['itemId'],
    components: {
      Page,
      Comment,
      ProfileLink,
    },
    data() {
      return {
        title: '',
        owner: '',
        ownerRoute: '',
        ownerTrustedClass: '',
        ownerTrustedClassHover: '',
        ownerTrustedClassCurrent: '',
        timestamp: '',
        body: '',
        description: '',
        isProfile: '',
        trustedThatTrust: [],
        childIds: [],
        reply: '',
      }
    },
    created() {
      this.loadData()
    },
    watch: {
      itemId() {
        this.loadData()
      }
    },
    methods: {
      loadData() {
        var item = new MixItem(this.$root, this.itemId)

        return item.init()
        .then(item => {
          item.account()
          .then(async account => {
            var trustLevel = await item.getTrustLevel()
            if (trustLevel != 1) {
              var trustLevelToggled = await item.getTrustLevelToggled()
              this.ownerTrustedClass = trustLevel ? (trustLevel == 2 ? 'mdi-verified' : 'mdi-shield') : 'mdi-shield-outline'
              this.ownerTrustedClassHover = trustLevelToggled ? (trustLevelToggled == 2 ? 'mdi-verified' : 'mdi-shield') : 'mdi-shield-outline'
              this.ownerTrustedClassCurrent = this.ownerTrustedClass
            }
            account.call(this.$accountProfile.methods.getProfile())
            .then(profileItemId => {
              this.ownerRoute = '/item/' + profileItemId
              return new MixItem(this.$root, profileItemId).init()
            })
            .then(profileItem => {
              return profileItem.latestRevision().load()
            })
            .then(profileRevision => {
              this.owner = profileRevision.getTitle()
            })
            .catch(() => {})
            .then(() => {
              this.childIds = item.childIds()

              if (!trustLevel) {
                this.title = ''
                this.body = 'Author not trusted.'
                this.description = ''
                return
              }

              item.latestRevision().load()
              .then(async revision => {
                this.title = revision.getTitle()
                this.timestamp = new Date(revision.getTimestamp() * 1000).toLocaleString()
                this.body = revision.getImage(512)
                this.description = revision.getDescription()

                if (revision.mixins[0].mixinId == '0x4bf3ce07') {
                  this.isProfile = true
                  this.trustedThatTrust = await window.activeAccount.getTrustedThatTrust(account.contractAddress)
                }

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
                    owner: this.owner,
                    ownerRoute: this.ownerRoute,
                  }))
                  .put('/historyIndex/' + this.$route.params.itemId, id)
                  .put('/historyCount', id + 1)
                  .write()
                })
              })
            })
          })
        })
      },
      publishReply(event) {
        var itemMessage = new this.$itemProto.Item()

        // Mixin type
        var mixinMessage = new this.$itemProto.Mixin()
        mixinMessage.setMixinId(0x874aba65)
        itemMessage.addMixin(mixinMessage)

        // BodyText
        var bodyTextMessage = new this.$bodyTextProto.BodyTextMixin()
        bodyTextMessage.setBodyText(this.reply)
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
            this.reply = ''
            this.loadData()
          })
        })
      },
      toggleTrust(event) {
        new MixItem(this.$root, this.itemId).init()
        .then(item => {
          return item.account()
        })
        .then(account => {
          window.activeAccount.call(this.$trustedAccounts.methods.getIsTrusted(account.contractAddress))
          .then(trusted => {
            if (trusted) {
              return window.activeAccount.sendData(this.$trustedAccounts.methods.untrustAccount(account.contractAddress), 0, 'Untrust account')
            }
            else {
              return window.activeAccount.sendData(this.$trustedAccounts.methods.trustAccount(account.contractAddress), 0, 'Trust account')
            }
          })
          .then(() => {
            this.loadData()
          })
        })
      },
    },
  }
</script>

<style>

  .shield {
    cursor: pointer;
    user-select: none;
  }

  .image img {
    width: 512px;
  }

  textarea {
    margin: 10px 0;
  }

</style>
