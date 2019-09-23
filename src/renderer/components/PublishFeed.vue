<template>
  <page>
    <template slot="title">
      {{ $t('PublishFeed.PublishFeed') }}
    </template>

    <template slot="body">
      <b-field :label="$t('PublishFeed.Title')">
        <b-input v-model="title"></b-input>
      </b-field>

      <b-field :label="$t('PublishFeed.Description')">
        <b-input v-model="description" type="textarea"></b-input>
      </b-field>

      <b-field :label="$t('PublishFeed.Image')" :message="filepath">
        <button class="button" @click="chooseFile">{{ $t('PublishFeed.ChooseImage') }}</button>
      </b-field>

      <topic-selector v-model="topics"></topic-selector>

      <button class="button is-primary" @click="publish">{{ $t('PublishFeed.Publish') }}</button>
    </template>
  </page>
</template>

<script lang="ts">
  import Page from './Page.vue'
  import TopicSelector from './TopicSelector.vue'
  import LanguageMixinProto from '../../lib/protobuf/LanguageMixin_pb.js'
  import TitleMixinProto from '../../lib/protobuf/TitleMixin_pb.js'
  import BodyTextMixinProto from '../../lib/protobuf/BodyTextMixin_pb.js'
  import MixContent from '../../lib/MixContent.js'
  import Image from '../../lib/Image.js'
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'publish-feed',
    components: {
      Page,
      TopicSelector,
    },
    data() {
      return {
        title: '',
        description: '',
        topics: [],
        filepath: '',
      }
    },
    created() {
      setTitle(this.$t('PublishFeed.PublishFeed'))
    },
    methods: {
      chooseFile(event) {
        let {dialog} = require('electron').remote
        dialog.showOpenDialog({
          title: this.$t('PublishFeed.ChooseImage'),
          filters: [{name: this.$t('PublishFeed.Images'), extensions: ['webp', 'jpg', 'jpeg', 'png', 'gif', 'tiff', 'svg', 'svgz', 'ppm']}],
        }, (fileNames) => {
          this.filepath = fileNames[0]
        })
      },
      async publish(event) {
        let flagsNonce = '0x0f' + this.$mixClient.web3.utils.randomHex(31).substr(2)
        let itemId = await this.$activeAccount.get().call(this.$mixClient.itemStoreIpfsSha256, 'getNewItemId', [this.$activeAccount.get().contractAddress, flagsNonce])

        let content = new MixContent(this.$root)

        // Mixin type
        content.addMixinPayload(0xbcec8faa)

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

        // Image
        if (this.filepath != '') {
          let image = new Image(this.$root, this.filepath)
          content.addMixinPayload(0x045eee8c, await image.createMixin())
        }

        let ipfsHash = await content.save()

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

        await this.$activeAccount.get().sendData(this.$mixClient.itemStoreIpfsSha256, 'create', [flagsNonce, ipfsHash], 0, 'Create feed')
        await this.$activeAccount.get().sendData(this.$mixClient.accountFeeds, 'addItem', [itemId], 0, 'Add feed to account')
        this.$router.push({ name: 'item', params: { itemId: itemId }})
      }
    },
  }
</script>
