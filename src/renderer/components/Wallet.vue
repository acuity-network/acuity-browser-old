<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">Wallet</h1>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <img :src="qrcode" />
          <h2>Balance</h2>
          {{ balance }}
        </div>

        <div class="container">
          <b-field label="To">
            <b-input v-model="to"></b-input>
          </b-field>
          <b-field label="Amount">
            <b-input v-model="amount"></b-input>
          </b-field>
          <b-field label="Comment">
            <b-input v-model="comment"></b-input>
          </b-field>
          <button type="submit" class="button is-primary" v-on:click="send">Send</button>
        </div>

      </section>
    </main>
  </div>
</template>

<script>
  var QRCode = require('qrcode')
  import MixAccount from '../../lib/MixAccount.js'
  export default {
    name: 'wallet',
    components: {},
    data() {
      return {
        qrcode: '',
        address: '',
        balance: '',
        to: '',
        amount: '',
        comment: '',
      }
    },
    methods: {
      send (event) {
        var account = new MixAccount(this, this.$web3.eth.defaultAccount)
        account.init()
        .then(() => {
          account.sendMix(this.to, this.$web3.utils.toWei(this.amount), this.comment)
        })
      },
    },
    beforeRouteEnter (to, from, next) {
      next(vm => {
        var account = new MixAccount(vm, vm.$web3.eth.defaultAccount)
        account.init()
        .then(() => {
          QRCode.toDataURL(account.contractAddress, {
            mode: 'alphanumeric',
            errorCorrectionLevel: 'H'
          })
          .then(qrcode => {
            vm.qrcode = qrcode
          })

          account.contract.events.Receive({
            toBlock: 'pending'
          })
          .on('data', event => {
            account.getBalance()
            .then(balance => {
              vm.balance = vm.$web3.utils.fromWei(balance) + ' MIX'
            })
          })

          account.getBalance()
          .then(balance => {
            vm.balance = vm.$web3.utils.fromWei(balance) + ' MIX'
          })
        })
      })
    },
  }
</script>
