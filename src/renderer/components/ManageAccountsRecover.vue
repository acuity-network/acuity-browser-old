<template>
  <page>
    <template slot="title">
      Recover account
    </template>

    <template slot="body">
      <b-field label="Recovery phrase" :type="recoveryType" :message="recoveryMessage">
        <b-input type="input" v-model="recoveryPhrase"></b-input>
      </b-field>
      <b-field label="Password">
        <b-input type="password" v-model="password" password-reveal></b-input>
      </b-field>
      <button class="button" @click="recover">Recover</button>
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
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'manage-accounts-recover',
    components: {
      Page,
    },
    data() {
      return {
        recoveryPhrase: '',
        recoveryType: '',
        recoveryMessage: '',
        password: '',
        privateKey: '',
        controllerAddress: '',
      }
    },
    methods: {
      async recover(event) {
        // Calculate private key and controller address.
        let node: BIP32Interface = bip32.fromSeed(await bip39.mnemonicToSeed(this.recoveryPhrase))
        let privateKey: Buffer = Buffer.from(node.derivePath("m/44'/76'/0'/0/0").privateKey)
        let controllerAddress: String = keythereum.privateKeyToAddress(privateKey)
        // Lookup contract address on blockchain.
        let contractAddress = await this.$mixClient.accountRegistry.methods.get(controllerAddress).call()
        if (contractAddress == 0x0000000000000000000000000000000000000000) {
          this.recoveryType = 'is-danger'
          this.recoveryMessage = 'Account not found.'
          return
        }
        // Encrypt private key.
        let salt: Buffer = crypto.randomBytes(32)
        let iv: Buffer = crypto.randomBytes(16)
        let keyObject: Object = keythereum.dump(this.password, privateKey, salt, iv)
        // Store account in database.
        await this.$db.batch()
        .put('/account/controllerAddress/' + controllerAddress, controllerAddress)
        .put('/account/controller/' + controllerAddress + '/contract', contractAddress)
        .put('/account/contract/' + contractAddress + '/controller', controllerAddress)
        .put('/account/controller/' + controllerAddress + '/keyObject', JSON.stringify(keyObject))
        .write()
        // Unlock account, select it and goto profile.
        let account: MixAccount = await new MixAccount(this, controllerAddress).init()
        account.unlock(this.password)
        account.select()
        this.$router.push({ name: 'profile', params: { controllerAddress: controllerAddress } })
      },
    },
    async created() {
      setTitle('Recover account')
    },
  }
</script>
