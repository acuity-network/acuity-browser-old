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
          <h2 class="subtitle">Balance</h2>
          {{ balance }}
          </div>
          <button class="button is-primary" v-on:click="activate">Activate account</button>
      </section>
    </main>
  </div>
</template>

<script>
  var QRCode = require('qrcode')

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
      balance() {
        return this.$web3.eth.getBalance(this.$route.params.address)
      }
    },
    methods: {
      activate: event => {
      }
    }
  }
</script>
