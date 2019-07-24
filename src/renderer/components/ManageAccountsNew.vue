<template>
  <page>
    <template slot="title">
      New account
    </template>

    <template slot="body">
      <b-message type="is-warning">
        <p>Everything published with MIX Acuity will be stored publically for eternity.</p>
        <p>There is NO WARRANTY, to the extent permitted by law.</p>
      </b-message>
      <b-message type="is-info">
        <p>The recovery phrase is the only way to recover your account. Write it down and store it securely. Do not store it on any electronic system.</p>
        <p>The password is for unlocking the account on this device. It is not used for account recovery.</p>
      </b-message>
      <b-field label="Recovery phrase">
        {{ recoveryPhrase }}
      </b-field>
      <b-field label="Password" :type="passwordType" :message="passwordMessage">
        <b-input type="password" v-model="password" password-reveal></b-input>
      </b-field>
      <b-field label="Repeat password" :type="passwordRepeatType" :message="passwordRepeatMessage">
        <b-input type="password" v-model="passwordRepeat" password-reveal></b-input>
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
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'manage-accounts-new',
    components: {
      Page,
    },
    data() {
      return {
        recoveryPhrase: '',
        password: '',
        passwordType: '',
        passwordMessage: '',
        passwordRepeat: '',
        passwordRepeatType: '',
        passwordRepeatMessage: '',
      }
    },
    methods: {
      async create(event) {
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
        // Encrypt private key.
        let salt: Buffer = crypto.randomBytes(32)
        let iv: Buffer = crypto.randomBytes(16)
        let keyObject: Object = keythereum.dump(this.password, privateKey, salt, iv)
        // Store account in database.
        await this.$db.batch()
        .put('/account/controllerAddress/' + controllerAddress, controllerAddress)
        .put('/account/controller/' + controllerAddress + '/keyObject', JSON.stringify(keyObject))
        .write()
        // Unlock account and goto activation page.
        let account: MixAccount = await new MixAccount(this, controllerAddress).init()
        account.unlock(this.password)
        this.$router.push({ name: 'manage-account-activate', params: { controllerAddress: controllerAddress } })
      },
    },
    async created() {
      setTitle('Create account')
      this.recoveryPhrase = bip39.generateMnemonic()
    },
  }
</script>
