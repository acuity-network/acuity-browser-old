<template>
  <div v-if="trusted" class="comment">
    <div class="profile is-clearfix">
      <div class="avatar is-pulled-left" v-html="avatar"></div>
      <span class="author">{{ author }}, {{ timestamp }}</span>
    </div>
    <div v-html="bodyText"></div>
    <comment v-for="childId in childIds" v-bind:itemId="childId"></comment>
    <b-input v-model="reply" type="textarea"></b-input>
    <button class="button is-primary" v-on:click="publishReply">Reply</button>
  </div>
</template>

<script>
  import MixItem from '../../lib/MixItem.js'

  export default {
    name: 'comment',
    props: ['itemId'],
    data() {
      return {
        trusted: false,
        avatar: '',
        author: '',
        timestamp: '',
        bodyText: '',
        childIds: [],
        reply: '',
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

        // Send a POST request
        var response  = await this.$http.post('http://127.0.0.1:5001/api/v0/add', data)
        const multihash = require('multihashes')
        var decodedHash = multihash.decode(multihash.fromB58String(response.data.Hash))

        if (decodedHash.name != 'sha2-256') {
          throw 'Wrong type of multihash.'
        }

        var hashHex = '0x' + decodedHash.digest.toString('hex')
        var flagsNonce = '0x00' + this.$web3.utils.randomHex(30).substr(2)
        var itemId = await window.activeAccount.call(this.$itemStoreIpfsSha256.methods.getNewItemId(flagsNonce))
        await window.activeAccount.sendData(this.$itemStoreIpfsSha256.methods.createWithParent(flagsNonce, hashHex, this.itemId), 0, 'Post comment')
        this.reply = ''
        this.loadData()
      },
    },
    async created() {
      this.loadData()
    },
  }

</script>

<style>

  .avatar img {
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

  .comment textarea {
    margin: 10px 0;
  }

</style>
