<template>
  <page>
    <template slot="title">
      <item-link v-if="short" :itemId="itemId"></item-link>
      <span v-else>{{ title }}</span>
      <span @click="copyItemId" class="clickable mdi mdi-24px mdi-link">
      </span>
      <span
        v-if="editable"
        @click="toggleEdit"
        class="clickable mdi mdi-24px mdi-square-edit-outline">
      </span>
      <span v-if="isFeed">
        <button v-if="!isSubscribed" class="button is-primary" @click="subscribe">Subscribe</button>
        <button v-if="isSubscribed" class="button is-primary" @click="unsubscribe">Unsubscribe</button>
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
      <span v-if="timestamp > 0">
        <timeago :datetime="timestamp" :autoUpdate="true"></timeago>
      </span>
      <span v-else>
        Just now
      </span>
    </template>

    <template slot="body">
      <div class="columns">
        <div class="column">
          <div class="image" v-html="body"></div>
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

      <reactions :itemId="itemId"></reactions>

      <div v-if="!short">
        <div v-if="isToken">
          <b-field label="Token address">
            {{ tokenAddress }}
          </b-field>
          <b-field label="Token symbol">
            {{ tokenSymbol }}
          </b-field>
          <b-field label="Token name">
            {{ tokenName }}
          </b-field>
          <b-field label="Token start">
            {{ tokenStart }}
          </b-field>
          <b-field label="Token owner">
            {{ tokenOwner }}
          </b-field>
          <b-field label="Token payout">
            {{ tokenPayout }}
          </b-field>
          <b-field label="Token supply">
            {{ tokenSupply }}
          </b-field>
        </div>

        <comment v-for="childId in childIds" :itemId="childId" :key="childId"></comment>

        <view-item v-for="feedId in feedItemIds" :itemId="feedId" :key="feedId"></view-item>

        <div v-if="startReply">
          <b-input v-model="reply" type="textarea" class="comment-box"></b-input>
          <button class="button is-primary" @click="publishReply">Reply</button>
          <button class="button" @click="startReply = false">Close</button>
        </div>
        <div v-else>
          <button class="button is-primary" @click="startReply = true">Reply</button>
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
  import VueMarkdown from 'vue-markdown'
  import titleProto from '../../lib/protobuf/title_pb.js'
  import descriptionProto from '../../lib/protobuf/description_pb.js'
  import bodyTextProto from '../../lib/protobuf/body_pb.js'
  import languageProto from '../../lib/protobuf/language_pb.js'
  import { clipboard } from 'electron'
  import formatByteCount from '../../lib/formatByteCount.js'
  import File from '../../lib/File.js'
  import twemoji from 'twemoji'

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
        data.ownerAddress = null
        data.owner = ''
        data.ownerRoute = ''
        data.ownerTrustedClass = ''
        data.ownerTrustedClassHover = ''
        data.ownerTrustedClassCurrent = ''
        data.inFeed = false
        data.feed = ''
        data.feedRoute = ''
        data.timestamp = ''
        data.body = ''
        data.description = ''
        data.hasFile = false
        data.file = null
        data.fileName = ''
        data.fileSize = ''
        data.fileHash = ''
        data.isProfile = ''
        data.isFeed = false
        data.isToken = false
        data.tokenSymbol = ''
        data.tokenName = ''
        data.tokenStart = ''
        data.tokenOwner = ''
        data.tokenPayout = ''
        data.tokenSupply = ''
        data.tokenAddress = ''
        data.childIds = []
        data.feedItemIds = []
        data.reply = ''
        data.startReply = false
        data.hasDownloaded = false
        data.downloadIcon = twemoji.parse(twemoji.convert.fromCodePoint('2B07'), {folder: 'svg', ext: '.svg'})
        data.checkIcon = twemoji.parse(twemoji.convert.fromCodePoint('2714'), {folder: 'svg', ext: '.svg'})
      },
      async loadData() {
        try {
          await this.$db.get('/accountSubscribed/' + window.activeAccount.contractAddress + '/' + this.itemId)
          this.isSubscribed = true
        }
        catch (e) {}
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

        this.childIds = await this.$mixClient.itemDagComments.methods.getAllChildIds(this.itemId).call()
        this.feedItemIds = (await this.$mixClient.itemDagFeedItems.methods.getAllChildIds(this.itemId).call()).reverse()

        if (!trustLevel) {
          this.title = ''
          this.body = 'Author not trusted.'
          this.description = ''
          return
        }

        let revision = await item.latestRevision().load()

        try {
          this.title = revision.getTitle()
          this.timestamp = new Date(revision.getTimestamp() * 1000)
          this.body = revision.getImage(512)
          this.description = revision.getDescription()
        }
        catch (e) {}

        if (revision.content.existMixin('0x0b62637e')) {
          this.hasFile = true
          let fileData = revision.getFile()
          this.file = new File(this.$root, fileData.name, fileData.size, fileData.hash)
          this.fileName = fileData.name
          this.fileSize = formatByteCount(fileData.size)
          this.fileHash = fileData.hash
        }

        if (revision.content.getPrimaryMixinId() == '0x4bf3ce07') {
          this.isProfile = true
        }
        else if (revision.content.getPrimaryMixinId() == '0xbcec8faa') {
          this.isFeed = true
        }
        else if (revision.content.getPrimaryMixinId() == '0x9fbbfaad') {
          this.isToken = true
          this.tokenAddress = await this.$tokenRegistry.methods.getToken(this.itemId).call()
          let token = new this.$mixClient.web3.eth.Contract(require('../../lib/contracts/CreatorToken.abi.json'), this.tokenAddress)
          this.tokenSymbol = await token.methods.symbol().call()
          this.tokenName = await token.methods.name().call()
          this.tokenStart = await token.methods.tokenStart().call()
          this.tokenOwner = await token.methods.tokenOwner().call()
          this.tokenPayout = await token.methods.tokenPayout().call()
          this.tokenSupply = await token.methods.totalSupply().call()
        }

        let id
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
      },
      async copyItemId(event) {
        clipboard.writeText(this.itemId)
        let notification = this.$notifications.itemIdCopied(this.title)
        new Notification(notification.title, notification)
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
        await window.activeAccount.sendData(this.$mixClient.itemStoreIpfsSha256, 'createNewRevision', [this.itemId, ipfsHash], 0, 'Update item')
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
        let flagsNonce = '0x00' + this.$mixClient.web3.utils.randomHex(31).substr(2)
        await window.activeAccount.sendData(this.$mixClient.itemDagComments, 'addChild', [this.itemId, '0x1c12e8667bd48f87263e0745d7b28ea18f74ac0e', flagsNonce], 0, 'Attach comment')
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
