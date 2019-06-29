<template>
  <page>
    <template slot="title">
      New account
    </template>

    <template slot="body">
      <b-field label="Recovery phrase">
        {{ recoveryPhrase }}
      </b-field>
      <b-field label="Password">
        <b-input type="password" v-model="password" password-reveal></b-input>
      </b-field>
      <button class="button" @click="create">{{ $t('create') }}</button>
    </template>
  </page>
</template>

<script lang="ts">
  import crypto from 'crypto'
  import * as bip32 from 'bip32'
  import { BIP32Interface } from 'bip32'
  import * as bip39  from 'bip39'
  import keythereum from 'keythereum'
  import Page from './Page.vue'
  import MixAccount from '../../lib/MixAccount.js'

  export default {
    name: 'manage-accounts-new',
    components: {
      Page,
    },
    data() {
      return {
        recoveryPhrase: '',
        password: '',
        privateKey: '',
        controllerAddress: '',
      }
    },
    methods: {
      async create(event) {
        let salt: Buffer = crypto.randomBytes(32)
        let iv: Buffer = crypto.randomBytes(16)
        let keyObject: Object = keythereum.dump(this.password, this.privateKey, salt, iv)
        this.$db.put('/account/controllerAddress/' + this.controllerAddress, this.controllerAddress)
        this.$db.put('/account/controller/' + this.controllerAddress + '/keyObject', JSON.stringify(keyObject))
        let account: MixAccount = await new MixAccount(this, this.controllerAddress).init()
        account.unlock(this.password)
        this.$router.push({ name: 'manage-account-activate', params: { controllerAddress: this.controllerAddress } })
      },
    },
    async created() {
      this.recoveryPhrase = bip39.generateMnemonic()
      let node: BIP32Interface = bip32.fromSeed(await bip39.mnemonicToSeed(this.recoveryPhrase))
      let child: BIP32Interface = node.derivePath("m/44'/76'/0'/0/0")
      this.privateKey = Buffer.from(child.privateKey)
      this.controllerAddress = keythereum.privateKeyToAddress(this.privateKey)
    },
  }
</script>
