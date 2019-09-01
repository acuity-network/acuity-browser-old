<template>
  <page>
    <template slot="title">
      <span v-if="isFeed">Feed: </span>
      <span v-if="isProfile">Profile: </span>
      <span v-if="isToken">Token: </span>
      <item-link v-if="short" :itemId="itemId"></item-link>
      <span v-else>{{ title }}</span>
      <span @click="copyItemId" class="clickable mdi mdi-24px mdi-link">
      </span>
      <span
        v-if="!short && editable"
        @click="toggleEdit"
        class="clickable mdi mdi-24px mdi-square-edit-outline">
      </span>
      <span v-if="isFeed">
        <button v-if="!isSubscribed" class="button is-primary" @click="subscribe">Subscribe</button>
        <button v-if="isSubscribed" class="button is-primary" @click="unsubscribe">Unsubscribe</button>
      </span>
      <span v-if="isToken">
        <button v-if="!isPortfolio" class="button is-primary" @click="portfolio">Add</button>
        <button v-if="isPortfolio" class="button is-primary" @click="unportfolio">Remove</button>
      </span>
    </template>

    <template slot="subtitle">
      by <profile-link :address="ownerAddress"></profile-link>&ensp;
      <span
        @mouseover="ownerTrustedClassCurrent = ownerTrustedClassHover"
        @mouseleave="ownerTrustedClassCurrent = ownerTrustedClass"
        :class="ownerTrustedClassCurrent" class="clickable mdi mdi-24px"
        @click="toggleTrust"></span><br />
      <span v-if="inFeed">in <router-link :to="feedRoute">{{ feed }}</router-link><br /></span>
      <span v-if="inTopic">on <router-link :to="topicRoute">{{ topic }}</router-link><br /></span>
      {{ published }}
    </template>
    <template slot="body">
      <div class="columns">
        <div class="column">
          <div class="image" v-html="image"></div>
          <div v-if="hasFile" class="file">
            <span v-if="!hasDownloaded" class="download" v-html="downloadIcon" v-on:click="downloadFile" ></span>
            <span v-if="hasDownloaded" class="check" v-html="checkIcon" ></span>
              {{ fileName }} <br/>
              Size: {{ fileSize }}
            </span>
          </div>
          <div class="bodyText"><vue-markdown class="markdown" :anchorAttributes="{target:'_blank'}" :source="description"></vue-markdown></div>
          <account-info v-if="isProfile" :address="ownerAddress"></account-info>
        </div>
        <div v-if="editing" class="column">
          <b-field label="Title">
            <b-input v-model="title"></b-input>
          </b-field>

          <b-field label="Description">
            <b-input v-model="description" type="textarea" rows="20"></b-input>
          </b-field>

          <button class="button is-primary" @click="publish">Publish</button>
        </div>
      </div>

      <reactions v-if="!isFeed" :itemId="itemId"></reactions>

      <div v-if="!short">
        <token-view v-if="isToken" :itemId="itemId"></token-view>

        <div v-if="isFeed">
          <view-item v-for="itemId in feedItemIds" :short="true" :itemId="itemId" :key="itemId"></view-item>
        </div>
        <div v-else>
          <comment v-for="itemId in commentIds" :itemId="itemId" :key="itemId"></comment>

          <div v-if="startReply">
            <b-input v-model="reply" type="textarea" class="comment-box"></b-input>
            <button class="button is-primary" @click="publishReply">Reply</button>
            <button class="button" @click="startReply = false">Close</button>
          </div>
          <div v-else>
            <button class="button is-primary" @click="startReply = true">Reply</button>
          </div>
        </div>
      </div>
    </template>
  </page>
</template>

<script>
  import MixItem from '../../lib/MixItem.js'
  import MixContent from '../../lib/MixContent.js'
  import Comment from './Comment.vue'
  import AccountInfo from './AccountInfo.vue'
  import ItemLink from './ItemLink.vue'
  import ProfileLink from './ProfileLink.vue'
  import Page from './Page.vue'
  import Reactions from './Reactions.vue'
  import TokenView from './mixins/TokenView.vue'
  import VueMarkdown from 'vue-markdown'
  import TitleMixinProto from '../../lib/protobuf/TitleMixin_pb.js'
  import MixinSchemaMixinProto from '../../lib/protobuf/MixinSchemaMixin_pb.js'
  import BodyTextMixinProto from '../../lib/protobuf/BodyTextMixin_pb.js'
  import LanguageMixinProto from '../../lib/protobuf/LanguageMixin_pb.js'
  import { clipboard } from 'electron'
  import formatByteCount from '../../lib/formatByteCount.js'
  import File from '../../lib/File.js'
  import twemoji from 'twemoji'
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'view-item',
    props: {
      itemId: {
        type: String,
        required: true,
      },
      short: {
        type: Boolean,
        default: false,
        required: false,
      },
    },
    components: {
      Page,
      Comment,
      AccountInfo,
      ItemLink,
      ProfileLink,
      TokenView,
      VueMarkdown,
      Reactions,
    },
    data() {
      let data = {}
      this.resetData(data)
      return data
    },
    created() {
      this.itemStoreIpfsSha256Emitter = this.$mixClient.itemStoreIpfsSha256.events.allEvents({
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

      this.itemDagCommentsEmitter = this.$mixClient.itemDagComments.events.allEvents({
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
    destroyed() {
      this.itemStoreIpfsSha256Emitter.unsubscribe()
      this.itemDagCommentsEmitter.unsubscribe()
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
        data.isSubscribed = false
        data.isPortfolio = false
        data.ownerAddress = null
        data.owner = ''
        data.ownerRoute = ''
        data.ownerTrustedClass = ''
        data.ownerTrustedClassHover = ''
        data.ownerTrustedClassCurrent = ''
        data.inFeed = false
        data.feed = ''
        data.feedRoute = ''
        data.inTopic = false
        data.topic = ''
        data.topicRoute = ''
        data.published = ''
        data.image = ''
        data.description = ''
        data.hasFile = false
        data.file = null
        data.fileName = ''
        data.fileSize = ''
        data.fileHash = ''
        data.isProfile = ''
        data.isFeed = false
        data.isToken = false
        data.commentIds = []
        data.feedItemIds = []
        data.reply = ''
        data.startReply = false
        data.hasDownloaded = false
        data.downloadIcon = twemoji.parse(twemoji.convert.fromCodePoint('2B07'), {folder: 'svg', ext: '.svg'})
        data.checkIcon = twemoji.parse(twemoji.convert.fromCodePoint('2714'), {folder: 'svg', ext: '.svg'})
      },
      async loadData() {
        let item = await new MixItem(this.$root, this.itemId).init()
        let account = await item.account()
        this.ownerAddress = account.contractAddress
        let trustLevel = await item.getTrustLevel()
        if (trustLevel != 1) {
          let trustLevelToggled = await item.getTrustLevelToggled()
          this.ownerTrustedClass = trustLevel ? (trustLevel == 2 ? 'mdi-verified' : 'mdi-shield') : 'mdi-shield-outline'
          this.ownerTrustedClassHover = trustLevelToggled ? (trustLevelToggled == 2 ? 'mdi-verified' : 'mdi-shield') : 'mdi-shield-outline'
          this.ownerTrustedClassCurrent = this.ownerTrustedClass
        }
        else {
          this.editable = item.isUpdatable()
        }

        let profileItemId = await account.call(this.$mixClient.accountProfile, 'getProfile')
        this.ownerRoute = '/item/' + profileItemId
        let profileItem = await new MixItem(this.$root, profileItemId).init()
        let profileRevision = await profileItem.latestRevision().load()
        this.owner = profileRevision.getTitle()

        let feedIds = await this.$mixClient.itemDagFeedItems.methods.getAllParentIds(this.itemId).call()
        if (feedIds.length > 0) {
          this.feedRoute = '/item/' + feedIds[0]
          let feedItem = await new MixItem(this.$root, feedIds[0]).init()
          let feedRevision = await feedItem.latestRevision().load()
          this.feed = feedRevision.getTitle()
          this.inFeed = true
        }

        let topicHashes = await this.$mixClient.itemTopics.methods.getItemTopicHashes(this.itemId).call()
        if (topicHashes.length > 0) {
          this.topicRoute = '/topic/' + topicHashes[0]
          this.topic = await this.$mixClient.itemTopics.methods.getTopic(topicHashes[0]).call()
          this.inTopic = true
        }

        this.commentIds = await this.$mixClient.itemDagComments.methods.getAllChildIds(this.itemId).call()
        this.feedItemIds = (await this.$mixClient.itemDagFeedItems.methods.getAllChildIds(this.itemId).call()).reverse()

        if (this.short && !trustLevel) {
          this.title = ''
          this.description = 'Author not trusted.'
          return
        }

        let firstRevision = await item.firstRevision().load()
        let revision = await item.latestRevision().load()

        try {
          this.title = revision.getTitle()
          if (!this.short) {
            setTitle(this.title)
          }
          let timestamp = firstRevision.getTimestamp()
          this.published = 'Published ' + ((timestamp > 0) ? 'on ' + new Date(timestamp * 1000).toLocaleDateString() : 'just now')
          this.image = revision.getImage(512)
          this.description = revision.getBodyText()
        }
        catch (e) {}

        if (revision.content.existMixin('0x3c5bba9c')) {
          this.hasFile = true
          let fileData = revision.getFile()
          this.file = new File(this.$root, fileData.name, fileData.size, fileData.hash)
          this.fileName = fileData.name
          this.fileSize = formatByteCount(fileData.size)
          this.fileHash = fileData.hash
        }

        if (revision.content.existMixin('0xbeef2144')) {
          this.isProfile = true
        }
        else if (revision.content.existMixin('0xbcec8faa')) {
          this.isFeed = true
          try {
            await this.$db.get('/accountSubscribed/' + window.activeAccount.contractAddress + '/' + this.itemId)
            this.isSubscribed = true
          }
          catch (e) {}
        }
        else if (revision.content.existMixin('0x9fbbfaad')) {
          this.isToken = true
          try {
            this.isPortfolio = await window.activeAccount.call(this.$mixClient.accountTokens, 'getItemExists', [this.itemId])
          }
          catch (e) {}
        }

        if (!this.short) {
          // Try to delete the old entry
          try {
            let id = await this.$db.get('/historyIndex/' + this.itemId)
            await this.$db.del('/history/' + id)
          }
          catch (e) {}

          let id
          try {
            id = parseInt(await this.$db.get('/historyCount'))
          }
          catch (e) {
            id = 0
          }

          this.$db.batch()
          .put('/history/' + id, JSON.stringify({
            itemId: this.itemId,
            timestamp: Date.now(),
            title: this.title,
            owner: this.owner,
            ownerRoute: this.ownerRoute,
          }))
          .put('/historyIndex/' + this.itemId, id)
          .put('/historyCount', id + 1)
          .write()
        }
      },
      copyItemId(event) {
        clipboard.writeText(this.itemId)
        this.$buefy.toast.open('itemId copied')
      },
      async toggleEdit(event) {
        this.editing = !this.editing
        if (!this.editing) {
          this.loadData()
        }
      },
      async subscribe(event) {
        await this.$db.put('/accountSubscribed/' + window.activeAccount.contractAddress + '/' + this.itemId, this.itemId)
        this.isSubscribed = true
      },
      async unsubscribe(event) {
        await this.$db.del('/accountSubscribed/' + window.activeAccount.contractAddress + '/' + this.itemId)
        this.isSubscribed = false
      },
      async portfolio(event) {
        await window.activeAccount.sendData(this.$mixClient.accountTokens, 'addItem', [this.itemId], 0, 'Add token to portfolio')
        this.isPortfolio = true
      },
      async unportfolio(event) {
        await window.activeAccount.sendData(this.$mixClient.accountTokens, 'removeItem', [this.itemId], 0, 'Remove token from portfolio')
        this.isPortfolio = false
      },
      async publish(event) {
        let item = await new MixItem(this.$root, this.itemId).init()
        let revision = await item.latestRevision().load()

        // Title
        let titleMessage = new TitleMixinProto.TitleMixin()
        titleMessage.setTitle(this.title)
        revision.content.removeMixins(0x344f4812)
        revision.content.addMixinPayload(0x344f4812, titleMessage.serializeBinary())

        // Body text
        let bodyTextMessage = new BodyTextMixinProto.BodyTextMixin()
        bodyTextMessage.setBodyText(this.description)
        revision.content.removeMixins(0x2d382044)
        revision.content.addMixinPayload(0x2d382044, bodyTextMessage.serializeBinary())

        let ipfsHash = await revision.content.save()
        this.editing = false
        await window.activeAccount.sendData(this.$mixClient.itemStoreIpfsSha256, 'createNewRevision', [this.itemId, ipfsHash], 0, 'Update item')
      },
      async publishReply(event) {
        let content = new MixContent(this.$root)

        // Language
        let languageMessage = new LanguageMixinProto.LanguageMixin()
        languageMessage.setLanguageTag('en-US')
        content.addMixinPayload(0x9bc7a0e6, languageMessage.serializeBinary())

        // BodyText
        let bodyTextMessage = new BodyTextMixinProto.BodyTextMixin()
        bodyTextMessage.setBodyText(this.reply)
        content.addMixinPayload(0x2d382044, bodyTextMessage.serializeBinary())

        let ipfsHash = await content.save()
        let flagsNonce = '0x00' + this.$mixClient.web3.utils.randomHex(31).substr(2)
        await window.activeAccount.sendData(this.$mixClient.itemDagComments, 'addChild', [this.itemId, '0x26b10bb026700148962c4a948b08ae162d18c0af', flagsNonce], 0, 'Attach comment')
        await window.activeAccount.sendData(this.$mixClient.itemStoreIpfsSha256, 'create', [flagsNonce, ipfsHash], 0, 'Post comment')
        this.reply = ''
        this.startReply = false
        this.loadData()
      },
      async downloadFile() {
        this.file.download()
        this.hasDownloaded = true
      },
      toggleTrust(event) {
        new MixItem(this.$root, this.itemId).init()
        .then(item => {
          return item.account()
        })
        .then(account => {
          window.activeAccount.call(this.$mixClient.trustedAccounts, 'getIsTrusted', [account.contractAddress])
          .then(trusted => {
            if (trusted) {
              return window.activeAccount.sendData(this.$mixClient.trustedAccounts, 'untrustAccount', [account.contractAddress], 0, 'Untrust account')
            }
            else {
              return window.activeAccount.sendData(this.$mixClient.trustedAccounts, 'trustAccount', [account.contractAddress], 0, 'Trust account')
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

  .download >>> img {
    cursor: pointer;
    height: 2.5em;
    width: 2.5em;
    margin-top: 0.3em;
    margin-right: 15px;
  }

  .check >>> img {
    height: 2.5em;
    width: 2.5em;
    margin-top: 0.3em;
    margin-right: 15px;
  }

  .button {
    margin-right:10px;

  }
</style>
