<template>
  <page>
    <template slot="title">
      {{ $t('ManageAccountsNew.CreateAccount') }}
    </template>

    <template slot="messages">
      <b-message type="is-warning">
        <p>{{ $t('ManageAccountsNew.Warning1') }}</p>
        <p>{{ $t('ManageAccountsNew.Warning2') }}</p>
        <p>{{ $t('ManageAccountsNew.Warning3') }}</p>
      </b-message>
      <b-message type="is-info">
        <p>{{ $t('ManageAccountsNew.Info1') }}</p>
        <p>{{ $t('ManageAccountsNew.Info2') }}</p>
      </b-message>
    </template>

    <template slot="body">
      <b-field :label="$t('ManageAccountsNew.RecoveryPhrase')">
        {{ recoveryPhrase }}
      </b-field>
      <b-field :label="$t('ManageAccountsNew.RepeatRecoveryPhrase')" :type="recoveryPhraseRepeatType" :message="recoveryPhraseRepeatMessage">
        <b-input type="input" v-model.trim="recoveryPhraseRepeat"></b-input>
      </b-field>
      <b-field :label="$t('ManageAccountsNew.Password')" :type="passwordType" :message="passwordMessage">
        <b-input type="password" v-model="password" password-reveal></b-input>
      </b-field>
      <b-field :label="$t('ManageAccountsNew.RepeatPassword')" :type="passwordRepeatType" :message="passwordRepeatMessage">
        <b-input type="password" v-model="passwordRepeat" password-reveal></b-input>
      </b-field>
      <button class="button" @click="create">{{ $t('ManageAccountsNew.Create') }}</button>
    </template>
  </page>
</template>

<script lang="ts">
  import Vue from 'vue'
  import * as bip32 from 'bip32'
  import { BIP32Interface } from 'bip32'
  import * as bip39  from 'bip39'
  import Page from '../Page.vue'
  import MixAccount from '../../../lib/MixAccount'
  import setTitle from '../../../lib/setTitle'

  export default Vue.extend({
    name: 'manage-accounts-new',
    components: {
      Page,
    },
    data() {
      return {
        recoveryPhrase: '',
        recoveryPhraseRepeat: '',
        recoveryPhraseRepeatType: '',
        recoveryPhraseRepeatMessage: '',
        password: '',
        passwordType: '',
        passwordMessage: '',
        passwordRepeat: '',
        passwordRepeatType: '',
        passwordRepeatMessage: '',
      }
    },
    methods: {
      async create(event: any) {
        // Repeat recovery phrase is required.
        if (this.recoveryPhraseRepeat == '') {
          this.recoveryPhraseRepeatType = 'is-danger'
          this.recoveryPhraseRepeatMessage = this.$t('ManageAccountsNew.RepeatRecoveryPhraseIsRequired')
          return
        }
        // Repeat recovery phrase must match recovery phrase.
        else if (this.recoveryPhraseRepeat != this.recoveryPhrase) {
          this.recoveryPhraseRepeatType = 'is-danger'
          this.recoveryPhraseRepeatMessage = this.$t('ManageAccountsNew.RepeatRecoveryPhraseIsIncorrect')
          return
        }
        else {
          this.recoveryPhraseRepeatType = ''
          this.recoveryPhraseRepeatMessage = ''
        }
        // Password is required.
        if (this.password == '') {
          this.passwordType = 'is-danger'
          this.passwordMessage = this.$t('ManageAccountsNew.PasswordIsRequired')
          return
        }
        else {
          this.passwordType = ''
          this.passwordMessage = ''
        }
        // Repeat password is required.
        if (this.passwordRepeat == '') {
          this.passwordRepeatType = 'is-danger'
          this.passwordRepeatMessage = this.$t('ManageAccountsNew.RepeatPasswordIsRequired')
          return
        }
        // Check passwords match.
        else if (this.password != this.passwordRepeat) {
          this.passwordRepeatType = 'is-danger'
          this.passwordRepeatMessage = this.$t('ManageAccountsNew.PasswordsDoNotMatch')
          return
        }
        else {
          this.passwordRepeatType = ''
          this.passwordRepeatMessage = ''
        }
        // Calculate private key and controller address.
        let node: BIP32Interface = bip32.fromSeed(await bip39.mnemonicToSeed(this.recoveryPhrase))
        let privateKey: string = '0x' + node.derivePath("m/44'/76'/0'/0/0").privateKey!.toString('hex')
        let controllerAddress: string = this.$mixClient.web3.eth.accounts.privateKeyToAccount(privateKey).address
        // Encrypt private key.
        let keyObject: object = this.$mixClient.web3.eth.accounts.encrypt(privateKey, this.password);
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
      setTitle(this.$t('ManageAccountsNew.CreateAccount'))
      this.recoveryPhrase = bip39.generateMnemonic()
    },
  })
</script>
