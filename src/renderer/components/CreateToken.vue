<template>
  <page>
    <template slot="title">
      Create Token
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

      <button class="button" v-on:click="chooseFile">{{ $t('chooseImage') }}</button>
      <button class="button is-primary" v-on:click="create">{{ $t('create') }}</button>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import languageProto from '../../lib/language_pb.js'
  import titleProto from '../../lib/title_pb.js'
  import descriptionProto from '../../lib/description_pb.js'
  import MixContent from '../../lib/MixContent.js'
  import Image from '../../lib/Image.js'
  import ethTx from 'ethereumjs-tx'
  import path from 'path'
  import fs from 'fs'

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
      delete window.fileNames
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
      async create(event) {
        let flagsNonce = '0x03' + this.$web3.utils.randomHex(30).substr(2)
        let itemId = await window.activeAccount.call(this.$itemStoreIpfsSha256.methods.getNewItemId(window.activeAccount.contractAddress, flagsNonce))

        let content = new MixContent(this.$root)

        // Token
        content.addMixin(0x9fbbfaad)

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

        let byteCodePath
    	  if (process.env.NODE_ENV !== 'development') {
          byteCodePath = path.join(remote.app.getAppPath(), '..', 'extraResources', 'CreatorToken.bin')
        }
        else {
          byteCodePath = path.join(remote.app.getAppPath(), '..', '..', '..', '..', '..', 'src', 'extraResources', 'CreatorToken.bin')
        }

        let tokenBytecode = fs.readFileSync(byteCodePath, 'ascii')
        let types = ['string', 'string', 'uint', 'uint', 'address', 'bytes32']
        let params = [this.symbol, this.name, 18, this.payout, this.$tokenRegistryAddress, itemId]
        let paramsBytecode = this.$web3.eth.abi.encodeParameters(types, params).slice(2)
        let nonce = await this.$web3.eth.getTransactionCount(window.activeAccount.controllerAddress)
        let rawTx = {
          nonce: this.$web3.utils.toHex(nonce),
          from: window.activeAccount.controllerAddress,
          gas: this.$web3.utils.toHex(2000000),
          gasPrice: '0x3b9aca00',
          data: '0x' + tokenBytecode + paramsBytecode,
        }

        let tx = new ethTx(rawTx)
        let privateKey = await this.$db.get('/account/controller/' + window.activeAccount.controllerAddress + '/privateKey')
        tx.sign(Buffer.from(privateKey.substr(2), 'hex'))
        let serializedTx = tx.serialize()

        this.$web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
        .on('error', console.log)
        .on('transactionHash', () => {
          this.$router.push({ name: 'item', params: { itemId: itemId }})
        })
      }
    },
    async created() {
    },
  }
</script>
