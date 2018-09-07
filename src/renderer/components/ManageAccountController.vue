<template>
  <page>
    <template slot="title">
      Manage account
    </template>

    <template slot="body">
      <img :src="qrcode" />
      <h2>Balance</h2>
      {{ balance }}
      <h2>Contract</h2>
      {{ contract }}
      <div>
        <button class="button is-primary" v-on:click="activate">Activate account</button>
      </div>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'

  var QRCode = require('qrcode')

  import MixAccount from '../../lib/MixAccount.js'

  export default {
    name: 'manage-account-controller',
    components: {
      Page,
    },
    data() {
      return {
        qrcode: '',
        contract: '',
        balance: '',
      }
    },
    methods: {
      activate() {
        var account = new MixAccount(this, this.$route.params.address)
        return account.deploy()
      }
    },
    created() {
      QRCode.toDataURL(this.$route.params.address, {
        mode: 'alphanumeric',
        errorCorrectionLevel: 'H'
      })
      .then(qrcode => {
        this.qrcode = qrcode
      })

      this.$db.get('/account/controller/' + this.$route.params.address + '/contract')
      .then(contractAddress => {
        this.contract = contractAddress
      })

      this.$web3.eth.getBalance(this.$route.params.address, 'pending')
      .then(balance => {
        this.balance = this.$web3.utils.fromWei(balance) + ' MIX'
      })
    },
  }
</script>
