<template>
  <page>
    <template slot="title">
      {{ title }}
      <span
        v-if="editable"
        v-on:click="toggleEdit"
        class="clickable mdi mdi-24px mdi-square-edit-outline">
      </span>
    </template>

    <template slot="subtitle">
      by <router-link :to="ownerRoute">{{ owner }}</router-link>&ensp;
      <span
        v-on:mouseover="ownerTrustedClassCurrent = ownerTrustedClassHover"
        v-on:mouseleave="ownerTrustedClassCurrent = ownerTrustedClass"
        :class="ownerTrustedClassCurrent" class="clickable mdi mdi-24px"
        v-on:click="toggleTrust"></span><br />
        <timeago :datetime="timestamp" :autoUpdate="true"></timeago>
    </template>

    <template slot="body">
      <div class="columns">
        <div class="column">
          <div class="image" v-html="body"></div>
          <div class="bodyText"><vue-markdown class="markdown" v-bind:source="description"></vue-markdown></div>

          <div v-if="isProfile">
            <b-field label="Trusted that trust">
              <profile-link v-for="address in trustedThatTrust" v-bind:address="address"></profile-link>
            </b-field>
          </div>
        </div>
        <div v-if="editing" class="column">
          <b-field label="Title">
            <b-input v-model="title"></b-input>
          </b-field>

          <b-field label="Description">
            <b-input v-model="description" type="textarea" rows="20"></b-input>
          </b-field>

          <button class="button is-primary" v-on:click="publish">Publish</button>
        </div>
      </div>

      <comment v-if="!isProfile" v-for="childId in childIds" v-bind:itemId="childId"></comment>

      <div v-if="startReply">
        <b-input v-model="reply" type="textarea" class="comment-box"></b-input>
        <button class="button is-primary" v-on:click="publishReply">Reply</button>
      </div>
      <div v-else>
        <button class="button is-primary" v-on:click="startReply = true">Reply</button>
      </div>
    </template>
  </page>
</template>

<script>
  import MixItem from '../../lib/MixItem.js'
  import MixContent from '../../lib/MixContent.js'
  import Comment from './Comment.vue'
  import ProfileLink from './ProfileLink.vue'
  import Page from './Page.vue'
  import VueMarkdown from 'vue-markdown'
  import titleProto from '../../lib/title_pb.js'
  import descriptionProto from '../../lib/description_pb.js'
  import bodyTextProto from '../../lib/body_pb.js'
  import languageProto from '../../lib/language_pb.js'

  export default {
    name: 'view-item',
    props: ['itemId'],
    components: {
      Page,
      Comment,
      ProfileLink,
      VueMarkdown,
    },
    data() {
      let data = {}
      this.resetData(data)
      return data
    },
    created() {
      this.$itemStoreIpfsSha256.events.allEvents({
        toBlock: 'pending',
        topics: [, this.itemId],
      })
      .on('data', log => {
        if (!this.editing) {
          this.loadData()
        }
      })
      .on('changed', log => {
        if (!this.editing) {
          this.loadData()
        }
      })

      this.$itemDagComments.events.allEvents({
        toBlock: 'pending',
        topics: [, this.itemId],
      })
      .on('data', log => {
        if (!this.editing) {
          this.loadData()
        }
      })
      .on('changed', log => {
        if (!this.editing) {
          this.loadData()
        }
      })

      this.loadData()
    },
    watch: {
      itemId() {
        this.resetData(this)
        this.loadData()
      }
    },
    methods: {
      resetData(data) {
        data.title = ''
        data.editable = false
        data.editing = false
        data.editForm = ''
        data.owner = ''
        data.ownerRoute = ''
        data.ownerTrustedClass = ''
        data.ownerTrustedClassHover = ''
        data.ownerTrustedClassCurrent = ''
        data.timestamp = ''
        data.body = ''
        data.description = ''
        data.isProfile = ''
        data.trustedThatTrust = []
        data.childIds = []
        data.reply = ''
        data.startReply = false
      },
      async loadData() {
        let item = await new MixItem(this.$root, this.itemId).init()
        let account = await item.account()
        let trustLevel = await item.getTrustLevel()
        if (trustLevel != 1) {
          var trustLevelToggled = await item.getTrustLevelToggled()
          this.ownerTrustedClass = trustLevel ? (trustLevel == 2 ? 'mdi-verified' : 'mdi-shield') : 'mdi-shield-outline'
          this.ownerTrustedClassHover = trustLevelToggled ? (trustLevelToggled == 2 ? 'mdi-verified' : 'mdi-shield') : 'mdi-shield-outline'
          this.ownerTrustedClassCurrent = this.ownerTrustedClass
        }
        else {
          this.editable = item.isUpdatable()
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
        .then(async () => {
          this.childIds = await this.$itemDagComments.methods.getAllChildIds(this.itemId).call()

          if (!trustLevel) {
            this.title = ''
            this.body = 'Author not trusted.'
            this.description = ''
            return
          }

          item.latestRevision().load()
          .then(async revision => {
            this.title = revision.getTitle()
            this.timestamp = new Date(revision.getTimestamp() * 1000)
            this.body = revision.getImage(512)
            this.description = revision.getDescription()

            if (revision.content.getPrimaryMixinId() == '0x4bf3ce07') {
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
      },
      async toggleEdit(event) {
        this.editing = !this.editing
        if (!this.editing) {
          this.loadData()
        }
      },
      async publish(event) {
        let item = await new MixItem(this.$root, this.itemId).init()
        let revision = await item.latestRevision().load()

        // Title
        let titleMessage = new titleProto.TitleMixin()
        titleMessage.setTitle(this.title)
        revision.content.removeMixins(0x24da6114)
        revision.content.addMixin(0x24da6114, titleMessage.serializeBinary())

        // Description
        let descriptionMessage = new descriptionProto.DescriptionMixin()
        descriptionMessage.setDescription(this.description)
        revision.content.removeMixins(0x5a474550)
        revision.content.addMixin(0x5a474550, descriptionMessage.serializeBinary())

        let ipfsHash = await revision.content.save()
        this.editing = false
        await window.activeAccount.sendData(this.$itemStoreIpfsSha256.methods.createNewRevision(this.itemId, ipfsHash), 0, 'Update item')
      },
      async publishReply(event) {
        let content = new MixContent(this.$root)

        // Comment
        content.addMixin(0x874aba65)

        // Language
        let languageMessage = new languageProto.LanguageMixin()
        languageMessage.setLanguageTag('en-US')
        content.addMixin(0x4e4e06c4, languageMessage.serializeBinary())

        // BodyText
        let bodyTextMessage = new bodyTextProto.BodyTextMixin()
        bodyTextMessage.setBodyText(this.reply)
        content.addMixin(0x34a9a6ec, bodyTextMessage.serializeBinary())

        let ipfsHash = await content.save()
        let flagsNonce = '0x00' + this.$web3.utils.randomHex(30).substr(2)
        await window.activeAccount.sendData(this.$itemDagComments.methods.addChild(this.itemId, '0x1c12e8667bd48f87263e0745d7b28ea18f74ac0e', flagsNonce), 0, 'Attach comment')
        await window.activeAccount.sendData(this.$itemStoreIpfsSha256.methods.create(flagsNonce, ipfsHash), 0, 'Post comment')
        this.reply = ''
        this.startReply = false
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

<style scoped>
  .clickable {
    cursor: pointer;
    user-select: none;
  }

  .image {
    width: 512px;
  }

  .comment-box {
    margin: 10px 0;
  }
</style>
