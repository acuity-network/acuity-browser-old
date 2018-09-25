<template>
  <div v-if="trusted" class="comment">
    <div class="profile is-clearfix">
      <div class="avatar is-pulled-left" v-html="avatar"></div>
      <span class="author">{{ author }}, {{ timestamp }}</span>
    </div>
    <vue-markdown class="markdown" v-bind:source="bodyText"></vue-markdown>
    <comment v-for="childId in childIds" v-bind:itemId="childId"></comment>
    <div v-if="startReply">
      <b-input v-model="reply" type="textarea" class="comment-box"></b-input>
      <button class="button is-primary" v-on:click="publishReply">Reply</button>
    </div>
    <div v-else>
      <button class="button is-primary" v-on:click="startReply = true">Reply</button>
    </div>
  </div>
</template>

<script>
  import MixItem from '../../lib/MixItem.js'
  import MixContent from '../../lib/MixContent.js'
  import VueMarkdown from 'vue-markdown'
  import bodyTextProto from '../../lib/body_pb.js'
  import languageProto from '../../lib/language_pb.js'

  export default {
    name: 'comment',
    props: ['itemId'],
    components: {
      VueMarkdown,
    },
    data() {
      return {
        trusted: false,
        avatar: '',
        author: '',
        timestamp: '',
        bodyText: '',
        childIds: [],
        reply: '',
        startReply: false,
      }
    },
    methods: {
      async loadData() {
        var item = await new MixItem(this.$root, this.itemId).init()
        this.trusted = await item.isTrusted()
        var account = await item.account()
        var itemId = await account.call(this.$accountProfile.methods.getProfile())
        var profile = await new MixItem(this.$root, itemId).init()
        var revision = await profile.latestRevision().load()
        this.avatar = revision.getImage(32, 32)
        this.author = revision.getTitle()

        var commentRevision = await item.latestRevision().load()
        this.timestamp = new Date(commentRevision.getTimestamp() * 1000).toLocaleString()
        this.bodyText = commentRevision.getBodyText()
        this.childIds = item.childIds()
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
        let itemId = await window.activeAccount.call(this.$itemStoreIpfsSha256.methods.getNewItemId(flagsNonce))
        await window.activeAccount.sendData(this.$itemStoreIpfsSha256.methods.createWithParent(flagsNonce, ipfsHash, this.itemId), 0, 'Post comment')
        this.reply = ''
        this.startReply = false
      },
    },
    created() {
      this.$itemStoreIpfsSha256.events.allEvents({
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
  }

</script>

<style scoped>
  .avatar {
    margin-right: 10px;
    object-fit: cover;
    width: 32px;
    height: 32px;
  }

  .author {
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
</style>
