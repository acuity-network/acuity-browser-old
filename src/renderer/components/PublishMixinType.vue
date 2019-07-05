<template>
  <page>
    <template slot="title">
      {{ $t('publishMixin') }}
    </template>

    <template slot="body">
      <b-field label="Title">
        <b-input v-model="title"></b-input>
      </b-field>

      <b-field label="Schema">
        <b-input v-model="schema" type="textarea"></b-input>
      </b-field>

      <b-field label="Description">
        <b-input v-model="description" type="textarea"></b-input>
      </b-field>

      <b-field label="Parent itemId">
        <b-input v-model="parentId" autocomplete="off" inputmode="verbatim" placeholder="0x0000000000000000000000000000000000000000000000000000000000000000" spellcheck="false" size="66" style="font-family: monospace;"></b-input>
      </b-field>

      <button class="button is-primary" @click="publish">{{ $t('publish') }}</button>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import MixContent from '../../lib/MixContent.js'
  import LanguageMixinProto from '../../lib/protobuf/LanguageMixin_pb.js'
  import TitleMixinProto from '../../lib/protobuf/TitleMixin_pb.js'
  import BodyTextMixinProto from '../../lib/protobuf/BodyTextMixin_pb.js'
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'publish-mixin-type',
    components: {
      Page,
    },
    data() {
      return {
        title: '',
        schema: '',
        description: '',
        parentId: '',
      }
    },
    created() {
      setTitle(this.$t('publishMixin'))
      delete window.fileNames
    },
    methods: {
      async publish(event) {
        let content = new MixContent(this.$root)

        // Mixin type
        content.addMixin(0x51c32e3a)

        // Language
        let languageMessage = new LanguageMixinProto.LanguageMixin()
        languageMessage.setLanguageTag('en-US')
        content.addMixin(0x4e4e06c4, languageMessage.serializeBinary())

        // Title
        let titleMessage = new TitleMixinProto.TitleMixin()
        titleMessage.setTitle(this.title)
        content.addMixin(0x24da6114, titleMessage.serializeBinary())

        // Body text
        let bodyTextMessage = new BodyTextMixinProto.BodyTextMixin()
        bodyTextMessage.setBodyText(this.description)
        content.addMixin(0x5a474550, bodyTextMessage.serializeBinary())

        // Schema
        if (this.schema.length > 0) {
          let bodyTextMessage = new BodyTextMixinProto.BodyTextMixin()
          bodyTextMessage.setBodyText(this.schema)
          content.addMixin(0x34a9a6ec, bodyTextMessage.serializeBinary())
        }

        let ipfsHash = await content.save()
        let flagsNonce = '0x00' + this.$mixClient.web3.utils.randomHex(31).substr(2)
        let itemId = await window.activeAccount.call(this.$mixClient.itemStoreIpfsSha256, 'getNewItemId', [window.activeAccount.contractAddress, flagsNonce])
        await window.activeAccount.sendData(this.$mixClient.itemStoreShortId, 'createShortId', [itemId], 0, 'Create short ID')
        await window.activeAccount.sendData(this.$mixClient.itemStoreIpfsSha256, 'create', [flagsNonce, ipfsHash], 0, 'Create mixin type')
        this.$router.push({ name: 'item', params: { itemId: itemId }})
      }
    },
  }
</script>
