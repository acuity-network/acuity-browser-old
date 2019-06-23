<template>
  <page>
    <template slot="title">
      New account
    </template>

    <template slot="body">
      <b-field label="Recovery phrase">
        {{ recoveryPhrase }}
      </b-field>

      <button class="button" @click="create">{{ $t('create') }}</button>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  let bip39 = require('bip39')  // this cant use import for some reason
  let ethUtil = require('ethereumjs-util')  // this cant use import for some reason

  export default {
    name: 'manage-accounts-new',
    components: {
      Page,
    },
    data() {
      return {
        recoveryPhrase: '',
        privateKey: '',
        controllerAddress: '',
      }
    },
    methods: {
      create(event) {
        this.$db.put('/account/controllerAddress/' + this.controllerAddress, this.controllerAddress)
        this.$db.put('/account/controller/' + this.controllerAddress + '/privateKey', this.privateKey)
        this.$router.push({ name: 'manage-account-activate', params: { controllerAddress: this.controllerAddress } })
      },
    },
    created() {
      this.recoveryPhrase = bip39.generateMnemonic()
      let pk = bip39.mnemonicToSeedSync(this.recoveryPhrase).toString('hex').substr(0, 64)
      this.privateKey = '0x' + pk
      this.controllerAddress = '0x' + ethUtil.privateToAddress(new Buffer.from(pk, 'hex')).toString('hex')
    },
  }
</script>
