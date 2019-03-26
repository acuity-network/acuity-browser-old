<template>
  <page>
    <template slot="title">
      New account
    </template>

    <template slot="body">
      <b-field label="Recovery phrase">
        {{ recoveryPhrase }}
      </b-field>
      <b-field label="Private key">
        {{ privateKey }}
      </b-field>
      <b-field label="Controller address">
        {{ controllerAddress }}
      </b-field>

      <button class="button" v-on:click="create">Create</button>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  let bip39 = require('bip39')
  let ethUtil = require('ethereumjs-util')

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
        this.$router.push({ name: 'manage-account-controller', params: { address: this.controllerAddress } })
      },
    },
    async created() {
      this.recoveryPhrase = bip39.generateMnemonic()
      let pk = bip39.mnemonicToSeedHex(this.recoveryPhrase).substr(0, 64)
      this.privateKey = '0x' + pk
      this.controllerAddress = '0x' + ethUtil.privateToAddress(new Buffer.from(pk, 'hex')).toString('hex')
      new Notification(this.$notifications.accountCreated.title, this.$notifications.accountCreated);
    },
  }
</script>
