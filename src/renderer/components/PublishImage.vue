<template>
  <page>
    <template slot="title">
      Publish Image
    </template>

    <template slot="body">
      <b-field label="Title">
        <b-input v-model="title"></b-input>
      </b-field>

      <b-field label="Description">
        <b-input v-model="description" type="textarea"></b-input>
      </b-field>

      <button class="button" v-on:click="chooseFile">Choose image</button>
      <button class="button is-primary" v-on:click="publish">Publish</button>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import languageProto from '../../lib/language_pb.js'
  import titleProto from '../../lib/title_pb.js'
  import bodyTextProto from '../../lib/body_pb.js'
  import descriptionProto from '../../lib/description_pb.js'
  import jpegImageProto from '../../lib/jpeg-image_pb.js'
  import Image from '../../lib/Image.js'
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
      }
    },
    methods: {
      chooseFile(event) {
        const {dialog} = require('electron').remote
        dialog.showOpenDialog({
          title: 'Choose image',
          filters: [{name: 'Images', extensions: ['webp', 'jpg', 'jpeg', 'png', 'gif', 'tiff', 'svg', 'svgz', 'ppm']}],
        }, (fileNames) => {
          window.fileNames = fileNames
        })
      },
      async publish(event) {
        let flagsNonce = '0x0f' + this.$web3.utils.randomHex(30).substr(2)
        let itemId = window.activeAccount.call(this.$itemStoreIpfsSha256.methods.getNewItemId(window.activeAccount.contractAddress, flagsNonce))

        let content = new MixContent(this.$root)

        // Image
        let image = new Image(this.$root, window.fileNames[0])
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
        await window.activeAccount.sendData(this.$itemStoreIpfsSha256.methods.create(flagsNonce, ipfsHash), 0, 'Create image')
        this.$router.push({ name: 'item', params: { itemId: await itemId }})
      }
    },
  }
</script>
