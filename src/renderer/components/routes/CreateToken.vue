<template>
  <page>
    <template slot="title">
      {{ $t('CreateToken.CreateToken') }}
    </template>

    <template slot="body">
      <template v-if="publishing">
        <b-progress type="is-info"></b-progress>
      </template>
      <template v-else>
        <b-field :label="$t('CreateToken.Symbol')">
          <b-input v-model="symbol"></b-input>
        </b-field>
        <b-field :label="$t('CreateToken.Name')">
          <b-input v-model="name"></b-input>
        </b-field>
        <b-field :label="$t('CreateToken.Description')">
          <b-input v-model="description" type="textarea"></b-input>
        </b-field>
        <b-field :label="$t('CreateToken.InitialBalance')">
          <b-input v-model="initialBalance"></b-input>
        </b-field>
        <b-field :label="$t('CreateToken.DailyPayout')">
          <b-input v-model="dailyPayout"></b-input>
        </b-field>

        <b-field class="file">
          <b-upload v-model="file">
            <a class="button is-primary">
              <b-icon icon="upload"></b-icon>
              <span>{{ $t('CreateToken.ChooseImage') }}</span>
            </a>
          </b-upload>
          <span class="file-name" v-if="file">
            {{ file.name }}
          </span>
        </b-field>

        <button class="button is-primary" @click="create">{{ $t('CreateToken.Create') }}</button>
      </template>
    </template>
  </page>
</template>

<script lang="ts">
  import Page from '../Page.vue'
  let LanguageMixinProto: any = require('../../../lib/protobuf/LanguageMixin_pb.js')
  let TitleMixinProto: any = require('../../../lib/protobuf/TitleMixin_pb.js')
  let BodyTextMixinProto: any = require('../../../lib/protobuf/BodyTextMixin_pb.js')
  import MixContent from '../../../lib/MixContent'
  import Image from '../../../lib/Image'
  import setTitle from '../../../lib/setTitle'
  import bs58 from 'bs58'

  export default {
    name: 'create-token',
    components: {
      Page,
    },
    data() {
      return {
        publishing: false,
        symbol: '',
        name: '',
        description: '',
        initialBalance: '',
        dailyPayout: '',
        file: null,
      }
    },
    created() {
      setTitle(this.$t('CreateToken.CreateToken'))
    },
    methods: {
      async create(event: any) {
        this.publishing = true
        try {
          let flagsNonce = '0x03' + this.$mixClient.web3.utils.randomHex(31).substr(2)
          let itemId = await this.$activeAccount.get().call(this.$mixClient.itemStoreIpfsSha256, 'getNewItemId', [this.$activeAccount.get().contractAddress, flagsNonce])

          let content = new MixContent(this.$root)

          // Token
          content.addMixinPayload('0x9fbbfaad')

          // Image
          if (this.file != null) {
            let image = new Image(this.$root, this.file)
            content.addMixinPayload('0x045eee8c', await image.createMixin())
          }

          // Language
          let languageMessage = new LanguageMixinProto.LanguageMixin()
          languageMessage.setLanguageTag(this.$settings.get('locale'))
          content.addMixinPayload('0x9bc7a0e6', languageMessage.serializeBinary())

          // Title
          let titleMessage = new TitleMixinProto.TitleMixin()
          titleMessage.setTitle(this.name)
          content.addMixinPayload('0x344f4812', titleMessage.serializeBinary())

          // Body text
          let bodyTextMessage = new BodyTextMixinProto.BodyTextMixin()
          bodyTextMessage.setBodyText(this.description)
          content.addMixinPayload('0x2d382044', bodyTextMessage.serializeBinary())

          let ipfsHash = await content.save()

          await this.$activeAccount.get().sendData(this.$mixClient.itemStoreIpfsSha256, 'create', [flagsNonce, ipfsHash], 0, 'Create token item')
          let tokenAddress = await this.$activeAccount.get().deployToken(this.symbol, this.name, this.$mixClient.web3.utils.toWei(this.initialBalance), this.$mixClient.web3.utils.toWei(this.dailyPayout))
          await this.$activeAccount.get().sendData(this.$mixClient.tokenItemRegistry, 'register', [tokenAddress, itemId], 0, 'Register token item')
          await this.$activeAccount.get().sendData(this.$mixClient.uniswapFactory, 'createExchange', [tokenAddress], 0, 'Deploy Uniswap exchange', 1000000)
          await this.$activeAccount.get().sendData(this.$mixClient.accountTokens, 'addItem', [itemId], 0, 'Add token item to account.')
          let encodedItemId = bs58.encode(Buffer.from(this.$mixClient.web3.utils.hexToBytes(itemId.substr(0, 50))))
          this.$router.push({ name: 'item', params: { encodedItemId: encodedItemId }})
        }
        catch (e) {
          this.$buefy.toast.open({message: e, type: 'is-danger'})
          this.publishing = false
        }
      }
    },
  }
</script>
