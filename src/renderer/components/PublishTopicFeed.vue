<template>
  <page>
    <template slot="title">
      Publish Topic Feed
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
  import MixContent from '../../lib/MixContent.js'
  import Image from '../../lib/Image.js'

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
        if (window.fileNames) {
          let image = new Image(this.$root, window.fileNames[0])
          content.addMixin(0x12745469, await image.createMixin())
        }

        let ipfsHash = await content.save()
        let flagsNonce = '0x00' + this.$web3.utils.randomHex(30).substr(2)
        let itemId = await window.activeAccount.call(this.$itemStoreIpfsSha256.methods.getNewItemId(window.activeAccount.contractAddress, flagsNonce))
        await window.activeAccount.sendData(this.$itemStoreIpfsSha256.methods.create(flagsNonce, ipfsHash), 0, 'Create image')
        this.$router.push({ name: 'item', params: { itemId: itemId }})
      }
    },
  }
</script>
