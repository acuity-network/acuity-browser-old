<template>
  <page>
    <template slot="title">
      Activate account
    </template>

    <template slot="body">
      <img :src="qrcode" />
      <b-field label="Balance">
        {{ balance }} MIX
      </b-field>
      <b-field label="Controller">
        {{ controllerAddress }}
      </b-field>

      <button class="button is-primary" v-on:click="activate">Activate account</button>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  var QRCode = require('qrcode')
  import MixAccount from '../../lib/MixAccount.js'

  export default {
    name: 'manage-account-activate',
    props: ['controllerAddress'],
    components: {
      Page,
    },
    data() {
      return {
        qrcode: '',
        balance: '',
      }
    },
    methods: {
      activate() {
        let account = new MixAccount(this, this.controllerAddress)
        return account.deploy()
      }
    },
    async created() {
      this.qrcode = await QRCode.toDataURL(this.controllerAddress, {
        mode: 'alphanumeric',
        errorCorrectionLevel: 'H'
      })

      this.contract = await this.$db.get('/account/controller/' + this.controllerAddress + '/contract')
      this.balance = this.$web3.utils.fromWei(await this.$web3.eth.getBalance(this.controllerAddress, 'pending'))
    },
  }
</script>
