<template>
  <page>
    <template slot="title">
      {{ $t('PublishFile.PublishFile') }}
    </template>

    <template slot="body">
      <b-field :label="$t('PublishFile.Title')">
        <b-input v-model="title"></b-input>
      </b-field>

      <b-field :label="$t('PublishFile.Description')">
        <b-input v-model="description" type="textarea"></b-input>
      </b-field>

      <b-field :label="$t('PublishFile.Feed')">
        <b-select v-model="feedId" :placeholder="$t('PublishFile.SelectAFeed')">
          <option
            v-for="feed in feeds"
            :value="feed.itemId"
            :key="feed.itemId">
            {{ feed.title }}
          </option>
        </b-select>
      </b-field>

      <token-selector v-model="tokenItemId"></token-selector>
      <topic-selector v-model="topics"></topic-selector>
      <mention-selector v-model="mentions"></mention-selector>

      <b-field class="file">
        <b-upload v-model="file" @input="fileUploaded">
          <a class="button is-primary">
            <b-icon icon="upload"></b-icon>
            <span>{{ $t('PublishFile.ChooseFile') }}</span>
          </a>
        </b-upload>
        <span class="file-name" v-if="file">
          {{ file.name }}
        </span>
      </b-field>

      <code v-html="output" style="display: block; font-size:small"></code>
      <button v-if="isDoneUploading" class="button is-primary" @click="publish">{{ $t('PublishFile.Publish') }}</button>
    </template>
  </page>
</template>

<script lang="ts">
  import Page from '../Page.vue'
  import TokenSelector from '../TokenSelector.vue'
  import TopicSelector from '../TopicSelector.vue'
  import MentionSelector from '../MentionSelector.vue'
  import LanguageMixinProto from '../../../lib/protobuf/LanguageMixin_pb.js'
  import TitleMixinProto from '../../../lib/protobuf/TitleMixin_pb.js'
  import BodyTextMixinProto from '../../../lib/protobuf/BodyTextMixin_pb.js'
  import FileMixinProto from '../../../lib/protobuf/FileMixin_pb.js'
  import MixItem from '../../../lib/MixItem'
  import MixContent from '../../../lib/MixContent'
  import formatByteCount from '../../../lib/formatByteCount'
  import bs58 from 'bs58'
  import setTitle from '../../../lib/setTitle'

  export default {
    name: 'publish-file',
    components: {
      Page,
      TokenSelector,
      TopicSelector,
      MentionSelector,
    },
    data() {
      return {
        title: '',
        description: '',
        tokenItemId: '',
        feeds: [{itemId: '0', title: 'none'}],
        feedId: '0',
        topics: [],
        mentions: [],
        file: null,
        isDoneUploading: false,
        output: '',
      }
    },
    async created() {
      setTitle(this.$t('PublishFile.PublishFile'))

      let feeds = await this.$activeAccount.get().call(this.$mixClient.accountFeeds, 'getAllItems')
      for (let itemId of feeds) {
        try {
          let item = await new MixItem(this.$root, itemId).init()
          let revision = await item.latestRevision().load()

          this.feeds.push({
            itemId: itemId,
            title: revision.getTitle(),
          })
        }
        catch (e) {}
      }
    },
    methods: {
      async fileUploaded(file) {
        this.output = this.$t('PublishFile.UploadingFile')
        this.fileHash = await this.$ipfsClient.add(file)
        this.fileName = file.name
        this.fileSize = file.size
        this.isDoneUploading = true
        this.output = this.$t('PublishFile.Name') + ': '+ this.fileName + '<br/>' +
          this.$t('PublishFile.Hash') + ': ' + this.fileHash + '<br/>' +
          this.$t('PublishFile.Size') + ': ' +  formatByteCount(this.fileSize)
      },
      async publish(event) {
        let flagsNonce = '0x0f' + this.$mixClient.web3.utils.randomHex(31).substr(2)
        let itemId = await this.$activeAccount.get().call(this.$mixClient.itemStoreIpfsSha256, 'getNewItemId', [this.$activeAccount.get().contractAddress, flagsNonce])

        let content = new MixContent(this.$root)

        // Language
        let languageMessage = new LanguageMixinProto.LanguageMixin()
        languageMessage.setLanguageTag(this.$settings.get('locale'))
        content.addMixinPayload('0x9bc7a0e6', languageMessage.serializeBinary())

        // Title
        let titleMessage = new TitleMixinProto.TitleMixin()
        titleMessage.setTitle(this.title)
        content.addMixinPayload('0x344f4812', titleMessage.serializeBinary())

        // Body text
        let bodyTextMessage = new BodyTextMixinProto.BodyTextMixin()
        bodyTextMessage.setBodyText(this.description)
        content.addMixinPayload('0x2d382044', bodyTextMessage.serializeBinary())

        // File
        let fileMessage = new FileMixinProto.FileMixin()
        fileMessage.setFilename(this.fileName)
        fileMessage.setIpfsHash(bs58.decode(this.fileHash))
        fileMessage.setFilesize(this.fileSize)
        content.addMixinPayload('0x3c5bba9c', fileMessage.serializeBinary())

        let ipfsHash = await content.save()

        if (this.tokenItemId != '') {
          await this.$activeAccount.get().sendData(this.$mixClient.itemDagTokenItems, 'addChild', [this.tokenItemId, '0x26b10bb026700148962c4a948b08ae162d18c0af', flagsNonce], 0, 'Attach token item')
        }

        if (this.feedId != '0') {
          await this.$activeAccount.get().sendData(this.$mixClient.itemDagFeedItems, 'addChild', [this.feedId, '0x26b10bb026700148962c4a948b08ae162d18c0af', flagsNonce], 0, 'Attach feed item')
        }

        for (let topic of this.topics) {
          let topicHash = this.$mixClient.web3.utils.keccak256(topic)
          try {
            await this.$activeAccount.get().call(this.$mixClient.itemTopics, 'getTopic', [topicHash])
          }
          catch (e) {
            await this.$activeAccount.get().sendData(this.$mixClient.itemTopics, 'createTopic', [topic], 0, 'Create topic.')
          }
          await this.$activeAccount.get().sendData(this.$mixClient.itemTopics, 'addItem', [topicHash, '0x26b10bb026700148962c4a948b08ae162d18c0af', flagsNonce], 0, 'Add item to topic.')
        }

        await this.$activeAccount.get().sendData(this.$mixClient.itemStoreIpfsSha256, 'create', [flagsNonce, ipfsHash], 0, 'Create image')
        let encodedItemId = bs58.encode(Buffer.from(this.$mixClient.web3.utils.hexToBytes(itemId.substr(0, 50))))
        this.$router.push({ name: 'item', params: { encodedItemId: encodedItemId }})
      }
    },
  }
</script>
