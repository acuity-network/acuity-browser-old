<template>
  <page>
    <template slot="title">
      Recover account
    </template>

    <template slot="body">
      <b-message type="is-warning">
        <p>Everything published with MIX Acuity will be stored publically for eternity.</p>
        <p>There is NO WARRANTY, to the extent permitted by law.</p>
      </b-message>
      <b-message type="is-info">
        <p>Enter the recovery phrase written down during account creation.</p>
        <p>The password is for unlocking the account on this device. It is does not need to be the password used previously for this account.</p>
      </b-message>
      <b-field label="Recovery phrase" :type="recoveryPhraseType" :message="recoveryPhraseMessage">
        <b-input type="input" v-model="recoveryPhrase"></b-input>
      </b-field>
      <b-field label="Password" :type="passwordType" :message="passwordMessage">
        <b-input type="password" v-model="password" password-reveal></b-input>
      </b-field>
      <b-field label="Repeat password" :type="passwordRepeatType" :message="passwordRepeatMessage">
        <b-input type="password" v-model="passwordRepeat" password-reveal></b-input>
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
        recoveryPhraseType: '',
        recoveryPhraseMessage: '',
        password: '',
        passwordType: '',
        passwordMessage: '',
        passwordRepeat: '',
        passwordRepeatType: '',
        passwordRepeatMessage: '',
        privateKey: '',
        controllerAddress: '',
      }
    },
    methods: {
      async recover(event) {
        // Check a recovery phrase is entered.
        if (this.recoveryPhrase.trim() == '') {
          this.recoveryPhraseType = 'is-danger'
          this.recoveryPhraseMessage = 'Recovery phrase is required.'
          return
        }
        else {
          this.recoveryPhraseType = ''
          this.recoveryPhraseMessage = ''
        }
        // Password is required.
        if (this.password == '') {
          this.passwordType = 'is-danger'
          this.passwordMessage = 'Password is required.'
          return
        }
        else {
          this.passwordType = ''
          this.passwordMessage = ''
        }
        // Check passwords match.
        if (this.password != this.passwordRepeat) {
          this.passwordRepeatType = 'is-danger'
          this.passwordRepeatMessage = 'Passwords do not match.'
          return
        }
        else {
          this.passwordRepeatType = ''
          this.passwordRepeatMessage = ''
        }
        // Calculate private key and controller address.
        let node: BIP32Interface = bip32.fromSeed(await bip39.mnemonicToSeed(this.recoveryPhrase))
        let privateKey: Buffer = Buffer.from(node.derivePath("m/44'/76'/0'/0/0").privateKey)
        let controllerAddress: String = keythereum.privateKeyToAddress(privateKey)
        // Lookup contract address on blockchain.
        let contractAddress
        try {
          contractAddress = await this.$mixClient.accountRegistry.methods.get(controllerAddress).call()
        }
        catch (e) {
          this.recoveryPhraseType = 'is-danger'
          this.recoveryPhraseMessage = 'Account not found.'
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
