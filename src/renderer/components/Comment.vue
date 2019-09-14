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
  import BodyTextMixinProto from '../../lib/protobuf/BodyTextMixin_pb.js'
  import LanguageMixinProto from '../../lib/protobuf/LanguageMixin_pb.js'
  import Reactions from './Reactions.vue'
  import ProfileLink from './ProfileLink.vue'
  import twemoji from 'twemoji'
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
        let item = await new MixItem(this.$root, this.itemId).init()
        this.trusted = await item.isTrusted()
        let account = await item.account()
        this.ownerAddress = account.contractAddress
        let itemId = await account.call(this.$mixClient.accountProfile, 'getProfile')
        let profile = await new MixItem(this.$root, itemId).init()
        let revision = await profile.latestRevision().load()
        this.avatar = revision.getImage(32, 32)

        let commentRevision = await item.latestRevision().load()
        this.timestamp = new Date(commentRevision.getTimestamp() * 1000)
        this.bodyText = commentRevision.getBodyText()
        this.childIds = await this.$mixClient.itemDagComments.methods.getAllChildIds(this.itemId).call()
        this.collapseIcon = this.visible ? minusIcon : plusIcon
      },
      async publishReply(event) {
        let content = new MixContent(this.$root)

        // Comment
        content.addMixinPayload(0x874aba65)

        // Language
        let languageMessage = new LanguageMixinProto.LanguageMixin()
        languageMessage.setLanguageTag(this.$settings.get('locale'))
        content.addMixinPayload(0x9bc7a0e6, languageMessage.serializeBinary())

        // BodyText
        let bodyTextMessage = new BodyTextMixinProto.BodyTextMixin()
        bodyTextMessage.setBodyText(this.reply)
        content.addMixinPayload(0x2d382044, bodyTextMessage.serializeBinary())

        let ipfsHash = await content.save()
        let flagsNonce = '0x00' + this.$mixClient.web3.utils.randomHex(31).substr(2)
        await this.$activeAccount.get().sendData(this.$mixClient.itemDagComments, 'addChild', [this.itemId, '0x26b10bb026700148962c4a948b08ae162d18c0af', flagsNonce], 0, 'Attach comment')
        await this.$activeAccount.get().sendData(this.$mixClient.itemStoreIpfsSha256, 'create', [flagsNonce, ipfsHash], 0, 'Post comment')
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
      this.itemStoreIpfsSha256EventsEmitter = this.$mixClient.itemStoreIpfsSha256.events.allEvents({
        toBlock: 'pending',
        topics: [, this.itemId],
      })
      .on('data', log => {
        this.loadData()
      })
      .on('changed', log => {
        this.loadData()
      })

      this.itemDagCommentsEmitter = this.$mixClient.itemDagComments.events.allEvents({
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
