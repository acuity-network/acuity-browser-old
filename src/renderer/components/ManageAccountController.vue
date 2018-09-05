<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <h1 class="title">Manage account</h1>
        </div>
      </section>

      <section class="section">
        <img :src="qrcode" />
        <h2>Balance</h2>
        {{ balance }}
        <h2>Contract</h2>
        {{ contract }}
        <div>
          <button class="button is-primary" v-on:click="activate">Activate account</button>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
  var QRCode = require('qrcode')

  import MixAccount from '../../lib/MixAccount.js'

  export default {
    name: 'manage-account-controller',
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
