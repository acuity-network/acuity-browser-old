<template>
  <page>
    <template slot="title">
      {{ $t('createToken') }}
    </template>

    <template slot="body">
      <b-field :label="$t('symbol')">
        <b-input v-model="symbol"></b-input>
      </b-field>
      <b-field :label="$t('name')">
        <b-input v-model="name"></b-input>
      </b-field>
      <b-field :label="$t('description')">
        <b-input v-model="description" type="textarea"></b-input>
      </b-field>
      <b-field :label="$t('dailyPayout')">
        <b-input v-model="payout"></b-input>
      </b-field>

      <button class="button" @click="chooseFile">{{ $t('chooseImage') }}</button>
      <button class="button is-primary" @click="create">{{ $t('create') }}</button>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import LanguageMixinProto from '../../lib/protobuf/LanguageMixin_pb.js'
  import TitleMixinProto from '../../lib/protobuf/TitleMixin_pb.js'
  import BodyTextMixinProto from '../../lib/protobuf/BodyTextMixin_pb.js'
  import MixContent from '../../lib/MixContent.js'
  import Image from '../../lib/Image.js'
  import ethTx from 'ethereumjs-tx'
  import path from 'path'
  import fs from 'fs'
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'create-token',
    components: {
      Page,
    },
    data() {
      return {
        symbol: '',
        name: '',
        description: '',
        payout: '',
      }
    },
    created() {
      setTitle(this.$t('createToken'))
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
      async create(event) {
        let flagsNonce = '0x03' + this.$mixClient.web3.utils.randomHex(31).substr(2)
        let itemId = await window.activeAccount.call(this.$mixClient.itemStoreIpfsSha256, 'getNewItemId', [window.activeAccount.contractAddress, flagsNonce])

        let content = new MixContent(this.$root)

        // Token
        content.addMixinPayload(0x9fbbfaad)

        // Image
        let image = new Image(this.$root, this.filepath)
        content.addMixinPayload(0x045eee8c, await image.createMixin())

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

        let ipfsHash = await content.save()

        await window.activeAccount.sendData(this.$mixClient.itemStoreIpfsSha256, 'create', [flagsNonce, ipfsHash], 0, 'Create image')
        await window.activeAccount.deployToken(this.symbol, this.name, this.payout, itemId)
        this.$router.push({ name: 'item', params: { itemId: itemId }})
      }
    },
  }
</script>
