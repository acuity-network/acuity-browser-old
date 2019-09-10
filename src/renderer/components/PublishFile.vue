<template>
  <page>
    <template slot="title">
      {{ $t('publishFile') }}
    </template>

    <template slot="body">
      <b-field label="Title">
        <b-input v-model="title"></b-input>
      </b-field>

      <b-field label="Description">
        <b-input v-model="description" type="textarea"></b-input>
      </b-field>

      <b-field label="Feed">
        <b-select v-model="feedId" placeholder="Select a feed">
          <option
            v-for="feed in feeds"
            :value="feed.itemId"
            :key="feed.itemId">
            {{ feed.title }}
          </option>
        </b-select>
      </b-field>

      <topic-selector v-model="topics"></topic-selector>

      <b-field label="File" :message="filepath">
        <button class="button" @click="chooseFile">{{ $t('chooseFile') }}</button>
      </b-field>
      <code id="output" style="display: block; font-size:small"></code>
      <button v-if="isDoneUploading" class="button is-primary" @click="publish">{{ $t('publish') }}</button>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import TopicSelector from './TopicSelector.vue'
  import LanguageMixinProto from '../../lib/protobuf/LanguageMixin_pb.js'
  import TitleMixinProto from '../../lib/protobuf/TitleMixin_pb.js'
  import BodyTextMixinProto from '../../lib/protobuf/BodyTextMixin_pb.js'
  import FileMixinProto from '../../lib/protobuf/FileMixin_pb.js'
  import MixItem from '../../lib/MixItem.js'
  import MixContent from '../../lib/MixContent.js'
  import fs from 'fs'
  import request from 'request'
  import File from '../../lib/File.js'
  import formatByteCount from '../../lib/formatByteCount.js'
  import Base58 from 'base-58'
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'publish-file',
    components: {
      Page,
      TopicSelector,
    },
    data() {
      return {
        title: '',
        description: '',
        feeds: [{itemId: '0', title: 'none'}],
        feedId: '0',
        topics: [],
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
      setTitle(this.$t('publishFile'))

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
          title: 'Choose File',
        }, (fileNames) => {
          this.isUploading = true
          this.fileUploadedSize = 0
          this.filePath = fileNames[0]
          let stats = fs.statSync(fileNames[0])
          this.fileTotalSize = stats.size
          output.innerHTML = 'Uploading file...'
          let req = request.post('http://127.0.0.1:5101/api/v0/add', (err, res, body) => {
            if (err) {
              console.log(err)
            } else {
              let jsonBody = JSON.parse(body)
              this.fileHash = jsonBody.Hash
              this.fileName = jsonBody.Name
              this.fileSize = jsonBody.Size
              this.isDoneUploading = true
              output.innerHTML = 'Name: '+ this.fileName + '<br/>' + 'Hash: '+ this.fileHash + '<br/>' + 'Size: ' +  formatByteCount(this.fileSize)
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
        languageMessage.setLanguageTag('en-US')
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
        fileMessage.setIpfsHash(Base58.decode(this.fileHash))
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
