<template>
  <page>
    <template slot="title">
      {{ $t('ManageAccountsRecover.RecoverAccount') }}
    </template>

    <template slot="body">
      <b-message type="is-warning">
        <p>{{ $t('ManageAccountsRecover.Warning1') }}</p>
        <p>{{ $t('ManageAccountsRecover.Warning2') }}</p>
        <p>{{ $t('ManageAccountsRecover.Warning3') }}</p>
      </b-message>
      <b-message type="is-info">
        <p>{{ $t('ManageAccountsRecover.Info1') }}</p>
        <p>{{ $t('ManageAccountsRecover.Info2') }}</p>
      </b-message>
      <b-field :label="$t('ManageAccountsRecover.RecoveryPhrase')" :type="recoveryPhraseType" :message="recoveryPhraseMessage">
        <b-input type="input" v-model.trim="recoveryPhrase"></b-input>
      </b-field>
      <b-field :label="$t('ManageAccountsRecover.Password')" :type="passwordType" :message="passwordMessage">
        <b-input type="password" v-model="password" password-reveal></b-input>
      </b-field>
      <b-field :label="$t('ManageAccountsRecover.RepeatPassword')" :type="passwordRepeatType" :message="passwordRepeatMessage">
        <b-input type="password" v-model="passwordRepeat" password-reveal></b-input>
      </b-field>
      <button class="button" @click="recover">{{ $t('ManageAccountsRecover.Recover') }}</button>
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
        if (this.recoveryPhrase == '') {
          this.recoveryPhraseType = 'is-danger'
          this.recoveryPhraseMessage = this.$t('ManageAccountsRecover.RecoveryPhraseIsRequired')
          return
        }
        else {
          this.recoveryPhraseType = ''
          this.recoveryPhraseMessage = ''
        }
        // Password is required.
        if (this.password == '') {
          this.passwordType = 'is-danger'
          this.passwordMessage = this.$t('ManageAccountsRecover.PasswordIsRequired')
          return
        }
        else {
          this.passwordType = ''
          this.passwordMessage = ''
        }
        // Check passwords match.
        if (this.password != this.passwordRepeat) {
          this.passwordRepeatType = 'is-danger'
          this.passwordRepeatMessage = this.$t('ManageAccountsRecover.PasswordsDoNotMatch')
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
          this.recoveryPhraseMessage = this.$t('ManageAccountsRecover.AccountNotFound')
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
      setTitle(this.$t('ManageAccountsRecover.RecoverAccount'))
    },
  }
</script>
