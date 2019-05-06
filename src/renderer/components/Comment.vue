<template>
  <div v-if="trusted" class="comment">
    <div class="profile is-clearfix">
      <div class="avatar is-pulled-left" v-html="avatar"></div>
      <profile-link :address="ownerAddress"></profile-link>
        <span v-if="timestamp > 0">
          <timeago :datetime="timestamp" :autoUpdate="true"></timeago>
        </span>
        <span v-else>
          just now
        </span>
      </span>
      <span class="collapse" v-html="collapseIcon" v-on:click="toggleCollapse"></span>
    </div>
    <div v-if="visible">
      <vue-markdown class="markdown" :anchorAttributes="{target:'_blank'}" :source="bodyText"></vue-markdown>
      <reactions :itemId="itemId"></reactions>
      <comment v-for="childId in childIds" :itemId="childId" :key="childId"></comment>
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

<script>
  import MixItem from '../../lib/MixItem.js'
  import MixContent from '../../lib/MixContent.js'
  import VueMarkdown from 'vue-markdown'
  import bodyTextProto from '../../lib/body_pb.js'
  import languageProto from '../../lib/language_pb.js'
  import Reactions from './Reactions.vue'
  import ProfileLink from './ProfileLink.vue'
  let twemoji = require('twemoji')
  let plusIcon = twemoji.parse(twemoji.convert.fromCodePoint('2795'), {folder: 'svg', ext: '.svg'}) 
  let minusIcon = twemoji.parse(twemoji.convert.fromCodePoint('2796'), {folder: 'svg', ext: '.svg'}) 

  export default {
    name: 'comment',
    props: ['itemId'],
    components: {
      VueMarkdown,
      Reactions,
      ProfileLink,
    },
    data() {
      return {
        trusted: false,
        avatar: '',
        ownerAddress: null,
        timestamp: '',
        bodyText: '',
        childIds: [],
        reply: '',
        startReply: false,
        visible: true,
        collapseIcon: ''
      }
    },
    methods: {
      async loadData() {
        var item = await new MixItem(this.$root, this.itemId).init()
        this.trusted = await item.isTrusted()
        var account = await item.account()
        this.ownerAddress = account.contractAddress
        var itemId = await account.call(this.$accountProfile.methods.getProfile())
        var profile = await new MixItem(this.$root, itemId).init()
        var revision = await profile.latestRevision().load()
        this.avatar = revision.getImage(32, 32)

        var commentRevision = await item.latestRevision().load()
        this.timestamp = new Date(commentRevision.getTimestamp() * 1000)
        this.bodyText = commentRevision.getBodyText()
        this.childIds = await this.$itemDagComments.methods.getAllChildIds(this.itemId).call()
        this.collapseIcon = this.visible ? minusIcon : plusIcon
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
        this.loadData()
      },
      toggleCollapse() {
        this.visible = !this.visible
        this.collapseIcon = this.visible ? minusIcon : plusIcon
      },
    },
    created() {
      this.itemStoreIpfsSha256EventsEmitter = this.$itemStoreIpfsSha256.events.allEvents({
        toBlock: 'pending',
        topics: [, this.itemId],
      })
      .on('data', log => {
        this.loadData()
      })
      .on('changed', log => {
        this.loadData()
      })

      this.itemDagCommentsEmitter = this.$itemDagComments.events.allEvents({
        toBlock: 'pending',
        topics: [, this.itemId],
      })
      .on('data', log => {
        this.loadData()
      })
      .on('changed', log => {
        this.loadData()
      })

      this.loadData()
    },
    destroyed() {
      this.itemStoreIpfsSha256EventsEmitter.unsubscribe()
      this.itemDagCommentsEmitter.unsubscribe()
    },
  }

</script>

<style scoped>
  .avatar {
    margin-right: 10px;
  }

  .avatar >>> img {
    object-fit: cover;
    width: 32px;
    height: 32px;
  }

  .profile {
    line-height: 32px;
  }

  .comment {
    padding: 10px;
    border: 1px #4a4a4a solid;
    border-radius: 10px;
    margin: 10px 0;
  }

  .comment-box {
    margin: 10px 0;
  }

  .button {
    margin-right:10px;
  }

  .collapse >>> img {
    cursor: pointer;
    height: 1.2em;
    width: 1.2em;
    vertical-align: -0.2em;
    margin-left: 0.25em;
  }

</style>
