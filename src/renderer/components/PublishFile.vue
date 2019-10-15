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

      <topic-selector v-model="topics"></topic-selector>
      <mention-selector v-model="mentions"></mention-selector>

      <b-field :label="$t('PublishFile.File')" :message="filepath">
        <button class="button" @click="chooseFile">{{ $t('PublishFile.ChooseFile') }}</button>
      </b-field>
      <code id="output" style="display: block; font-size:small"></code>
      <button v-if="isDoneUploading" class="button is-primary" @click="publish">{{ $t('PublishFile.Publish') }}</button>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import TopicSelector from './TopicSelector.vue'
  import MentionSelector from './MentionSelector.vue'
  import LanguageMixinProto from '../../lib/protobuf/LanguageMixin_pb.js'
  import TitleMixinProto from '../../lib/protobuf/TitleMixin_pb.js'
  import BodyTextMixinProto from '../../lib/protobuf/BodyTextMixin_pb.js'
  import FileMixinProto from '../../lib/protobuf/FileMixin_pb.js'
  import MixItem from '../../lib/MixItem.js'
  import MixContent from '../../lib/MixContent.js'
  import fs from 'fs'
  import request from 'request'
  import formatByteCount from '../../lib/formatByteCount.js'
  import bs58 from 'bs58'
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'publish-file',
    components: {
      Page,
      TopicSelector,
      MentionSelector,
    },
    data() {
      return {
        title: '',
        description: '',
        feeds: [{itemId: '0', title: 'none'}],
        feedId: '0',
        topics: [],
        mentions: [],
        filepath: '',
        fileTotalSize: 0,
        isUploading: false,
        isDoneUploading: false,
        fileHash:'',
        fileName:'',
        fileSize:'',
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
      chooseFile(event) {
        const {dialog} = require('electron').remote
        dialog.showOpenDialog({
          title: this.$t('PublishFile.ChooseFile'),
        }, (fileNames) => {
          this.isUploading = true
          this.fileUploadedSize = 0
          this.filePath = fileNames[0]
          let stats = fs.statSync(fileNames[0])
          this.fileTotalSize = stats.size
          output.innerHTML = this.$t('PublishFile.UploadingFile')
          let req = request.post('http://127.0.0.1:5101/api/v0/add', (err, res, body) => {
            if (err) {
              console.log(err)
            } else {
              let jsonBody = JSON.parse(body)
              this.fileHash = jsonBody.Hash
              this.fileName = jsonBody.Name
              this.fileSize = jsonBody.Size
              this.isDoneUploading = true
              output.innerHTML = this.$t('PublishFile.Name') + ': '+ this.fileName + '<br/>' +
                this.$t('PublishFile.Hash') + ': ' + this.fileHash + '<br/>' +
                this.$t('PublishFile.Size') + ': ' +  formatByteCount(this.fileSize)
            }
          })
          let form = req.form()
          form.append('file', fs.createReadStream(fileNames[0]))
        })
      },
      async publish(event) {
        let flagsNonce = '0x0f' + this.$mixClient.web3.utils.randomHex(31).substr(2)
        let itemId = await this.$activeAccount.get().call(this.$mixClient.itemStoreIpfsSha256, 'getNewItemId', [this.$activeAccount.get().contractAddress, flagsNonce])

        let content = new MixContent(this.$root)

        // Language
        let languageMessage = new LanguageMixinProto.LanguageMixin()
        languageMessage.setLanguageTag(this.$settings.get('locale'))
        content.addMixinPayload(0x9bc7a0e6, languageMessage.serializeBinary())

        // Title
        let titleMessage = new TitleMixinProto.TitleMixin()
        titleMessage.setTitle(this.title)
        content.addMixinPayload(0x344f4812, titleMessage.serializeBinary())

        // Body text
        let bodyTextMessage = new BodyTextMixinProto.BodyTextMixin()
        bodyTextMessage.setBodyText(this.description)
        content.addMixinPayload(0x2d382044, bodyTextMessage.serializeBinary())

        // File
        let fileMessage = new FileMixinProto.FileMixin()
        fileMessage.setFilename(this.fileName)
        fileMessage.setIpfsHash(bs58.decode(this.fileHash))
        fileMessage.setFilesize(this.fileSize)
        content.addMixinPayload(0x3c5bba9c, fileMessage.serializeBinary())

        let ipfsHash = await content.save()

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
        this.$router.push({ name: 'item', params: { itemId: itemId }})
      }
    },
  }
</script>
