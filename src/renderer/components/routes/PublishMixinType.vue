<template>
  <page>
    <template slot="title">
      {{ $t('PublishMixinType.PublishMixinType') }}
    </template>

    <template slot="body">
      <b-field :label="$t('PublishMixinType.Title')">
        <b-input v-model="title"></b-input>
      </b-field>

      <b-field :label="$t('PublishMixinType.Schema')">
        <b-input v-model="schema" type="textarea"></b-input>
      </b-field>

      <b-field :label="$t('PublishMixinType.Description')">
        <b-input v-model="description" type="textarea"></b-input>
      </b-field>

      <b-field :label="$t('PublishMixinType.ParentItemId')">
        <b-input v-model="parentId" autocomplete="off" inputmode="verbatim" placeholder="0x0000000000000000000000000000000000000000000000000000000000000000" spellcheck="false" size="66" style="font-family: monospace;"></b-input>
      </b-field>

      <button class="button is-primary" @click="publish">{{ $t('PublishMixinType.Publish') }}</button>
    </template>
  </page>
</template>

<script lang="ts">
  import Page from '../Page.vue'
  import MixContent from '../../../lib/MixContent'
  let LanguageMixinProto: any = require('../../../lib/protobuf/LanguageMixin_pb.js')
  let TitleMixinProto: any = require('../../../lib/protobuf/TitleMixin_pb.js')
  let BodyTextMixinProto: any = require('../../../lib/protobuf/BodyTextMixin_pb.js')
  let MixinSchemaMixinProto: any = require('../../../lib/protobuf/MixinSchemaMixin_pb.js')
  import setTitle from '../../../lib/setTitle'
  import bs58 from 'bs58'

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
      setTitle(this.$t('PublishMixinType.PublishMixinType'))
    },
    methods: {
      async publish(event: any) {

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

        // Schema
        let mixinSchemaMessage = new MixinSchemaMixinProto.MixinSchemaMixin()
        mixinSchemaMessage.setMixinSchema(this.schema)
        content.addMixinPayload('0xcdce4e5d', mixinSchemaMessage.serializeBinary())

        let ipfsHash = await content.save()
        let flagsNonce = '0x10' + this.$mixClient.web3.utils.randomHex(31).substr(2)
        let itemId = await this.$activeAccount.get().call(this.$mixClient.itemStoreIpfsSha256, 'getNewItemId', [this.$activeAccount.get().contractAddress, flagsNonce])
        await this.$activeAccount.get().sendData(this.$mixClient.itemStoreShortId, 'createShortId', [itemId], 0, 'Create short ID')
//        await this.$activeAccount.get().sendData(this.$mixClient.itemDagMixins, 'addChild', [this.parentId.trim(), '0x26b10bb026700148962c4a948b08ae162d18c0af', flagsNonce], 0, 'Attach mixin to parent')
        await this.$activeAccount.get().sendData(this.$mixClient.itemStoreIpfsSha256, 'create', [flagsNonce, ipfsHash], 0, 'Create mixin type')
        let encodedItemId = bs58.encode(Buffer.from(this.$mixClient.web3.utils.hexToBytes(itemId.substr(0, 50))))
        this.$router.push({ name: 'item', params: { encodedItemId: encodedItemId }})
      }
    },
  }
</script>
