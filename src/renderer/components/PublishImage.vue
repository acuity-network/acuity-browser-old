<template>
  <page>
    <template slot="title">
      {{ $t('publishImage') }}
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

      <b-field label="Image" :message="filepath">
        <button class="button" @click="chooseFile">{{ $t('chooseImage') }}</button>
      </b-field>

      <button class="button is-primary" @click="publish">{{ $t('publish') }}</button>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import languageProto from '../../lib/protobuf/language_pb.js'
  import titleProto from '../../lib/protobuf/title_pb.js'
  import bodyTextProto from '../../lib/protobuf/body_pb.js'
  import descriptionProto from '../../lib/protobuf/description_pb.js'
  import jpegImageProto from '../../lib/protobuf/jpeg-image_pb.js'
  import Image from '../../lib/Image.js'
  import MixItem from '../../lib/MixItem.js'
  import MixContent from '../../lib/MixContent.js'

  export default {
    name: 'publish-image',
    components: {
      Page,
    },
    data() {
      return {
        title: '',
        description: '',
        feeds: [{itemId: '0', title: 'none'}],
        feedId: '0',
        filepath: '',
      }
    },
    created() {
      delete window.fileNames
      this.$db.createValueStream({
        'gte': '/accountFeeds/' + window.activeAccount.contractAddress + '/',
        'lt': '/accountFeeds/' + window.activeAccount.contractAddress + '/z',
      })
      .on('data', async itemId => {
        try {
          let item = await new MixItem(this.$root, itemId).init()
          let revision = await item.latestRevision().load()

          this.feeds.push({
            itemId: itemId,
            title: revision.getTitle(),
          })
        }
        catch (e) {}
      })
    },
    methods: {
      chooseFile(event) {
        const {dialog} = require('electron').remote
        dialog.showOpenDialog({
          title: 'Choose image',
          filters: [{name: 'Images', extensions: ['webp', 'jpg', 'jpeg', 'png', 'gif', 'tiff', 'svg', 'svgz', 'ppm']}],
        }, (fileNames) => {
          this.filepath = fileNames[0]
        })
      },
      async publish(event) {
        let flagsNonce = '0x0f' + this.$web3.utils.randomHex(31).substr(2)
        let itemId = await window.activeAccount.call(this.$itemStoreIpfsSha256, 'getNewItemId', [window.activeAccount.contractAddress, flagsNonce])

        let content = new MixContent(this.$root)

        // Image
        let image = new Image(this.$root, this.filepath)
        content.addMixin(0x12745469, await image.createMixin())

        // Language
        let languageMessage = new languageProto.LanguageMixin()
        languageMessage.setLanguageTag('en-US')
        content.addMixin(0x4e4e06c4, languageMessage.serializeBinary())

        // Title
        let titleMessage = new titleProto.TitleMixin()
        titleMessage.setTitle(this.title)
        content.addMixin(0x24da6114, titleMessage.serializeBinary())

        // Description
        let descriptionMessage = new descriptionProto.DescriptionMixin()
        descriptionMessage.setDescription(this.description)
        content.addMixin(0x5a474550, descriptionMessage.serializeBinary())

        let ipfsHash = await content.save()

        if (this.feedId != '0') {
          await window.activeAccount.sendData(this.$itemDagFeedItems, 'addChild', [this.feedId, '0x1c12e8667bd48f87263e0745d7b28ea18f74ac0e', flagsNonce], 0, 'Attach feed item')
        }

        await window.activeAccount.sendData(this.$itemStoreIpfsSha256, 'create', [flagsNonce, ipfsHash], 0, 'Create image')
        this.$router.push({ name: 'item', params: { itemId: itemId }})
      }
    },
  }
</script>
