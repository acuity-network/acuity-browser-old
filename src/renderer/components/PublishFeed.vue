<template>
  <page>
    <template slot="title">
      {{ $t('publishFeed') }}
    </template>

    <template slot="body">
      <b-field label="Title">
        <b-input v-model="title"></b-input>
      </b-field>

      <b-field label="Description">
        <b-input v-model="description" type="textarea"></b-input>
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
  import MixContent from '../../lib/MixContent.js'
  import Image from '../../lib/Image.js'
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'publish-image',
    components: {
      Page,
    },
    data() {
      return {
        title: '',
        description: '',
        filepath: '',
      }
    },
    created() {
      setTitle(this.$t('publishFeed'))
      delete window.fileNames
    },
    methods: {
      chooseFile(event) {
        let {dialog} = require('electron').remote
        dialog.showOpenDialog({
          title: 'Choose image',
          filters: [{name: 'Images', extensions: ['webp', 'jpg', 'jpeg', 'png', 'gif', 'tiff', 'svg', 'svgz', 'ppm']}],
        }, (fileNames) => {
          this.filepath = fileNames[0]
        })
      },
      async publish(event) {
        let flagsNonce = '0x0f' + this.$mixClient.web3.utils.randomHex(31).substr(2)
        let itemId = await window.activeAccount.call(this.$mixClient.itemStoreIpfsSha256, 'getNewItemId', [window.activeAccount.contractAddress, flagsNonce])

        let content = new MixContent(this.$root)

        // Mixin type
        content.addMixin(0xbcec8faa)

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

        // Image
        if (this.filepath != '') {
          let image = new Image(this.$root, this.filepath)
          content.addMixin(0x12745469, await image.createMixin())
        }

        let ipfsHash = await content.save()
        await window.activeAccount.sendData(this.$mixClient.itemStoreIpfsSha256, 'create', [flagsNonce, ipfsHash], 0, 'Create feed')
        await window.activeAccount.sendData(this.$mixClient.accountFeeds, 'addItem', [itemId], 0, 'Add feed to account')
        await this.$db.put('/accountFeeds/' + window.activeAccount.contractAddress + '/' + itemId, itemId)
        this.$router.push({ name: 'item', params: { itemId: itemId }})
      }
    },
  }
</script>
