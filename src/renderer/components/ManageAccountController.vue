<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">Manage account</h1>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <img :src="qrcode" />
          <h2>Balance</h2>
          {{ balance }}
          <h2>Contract</h2>
          {{ contract }}
          <div>
            <button class="button is-primary" v-on:click="activate">Activate account</button>
          </div>
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
    components: {},
    asyncComputed: {
      qrcode() {
        return QRCode.toDataURL(this.$route.params.address, {
          mode: 'alphanumeric',
          errorCorrectionLevel: 'H'
        })
      },
      contract() {
        return this.$db.get('/account/controller/' + this.$route.params.address + '/contract')
      },
      balance() {
        return this.$web3.eth.getBalance(this.$route.params.address, 'pending')
        .then(balance => {
          return this.$web3.utils.fromWei(balance) + ' MIX'
        })
      }
    },
    methods: {
      activate() {
        var account = new MixAccount(this, this.$route.params.address)
        return account.deploy()
      }
    }
  }
</script>
