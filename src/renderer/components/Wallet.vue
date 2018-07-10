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
          <button type="submit" class="button is-primary" v-on:click="confirm">Send</button>
        </div>

        <div class="container">
          <b-table :data="data" :columns="columns"></b-table>
        </div>

      </section>
    </main>
  </div>
</template>

<script>
  var QRCode = require('qrcode')
  import MixAccount from '../../lib/MixAccount.js'
  import WalletConfirmSend from './WalletConfirmSend.vue'

  export default {
    name: 'wallet',
    components: {
      WalletConfirmSend,
    },
    data() {
      return {
        qrcode: '',
        address: '',
        balance: '',
        to: '',
        amount: '',
        comment: '',
        data: [],
        columns: [
          {
            field: 'when',
            label: 'When',
          },
          {
            field: 'to',
            label: 'To',
          },
          {
            field: 'fee',
            label: 'Fee',
            numeric: true
          },
          {
            field: 'amount',
            label: 'Amount',
            numeric: true
          },
        ],
      }
    },
    methods: {
      loadData(account) {
        var BN = this.$web3.utils.BN

        account.getBalance()
        .then(balance => {
          this.balance = this.$web3.utils.fromWei(balance) + ' MIX'
        })

        this.$web3.eth.getTransactionCount(this.$web3.eth.defaultAccount)
        .then(nonce => {
          var transactions = [];
          var data = []
          for (var i = 1; i <= 20; i++) {
            transactions.push(account.getTransactionInfo(nonce - i)
              .catch(err => {
                return false
              })
            )
          }
          Promise.all(transactions)
          .then(results => {
            for (var i = 0; i < results.length; i++) {
              if (results[i]) {
                data.push({
                  'when': results[i].block ? new Date(results[i].block.timestamp * 1000).toLocaleString() : 'pending',
                  'to': results[i].to,
                  'fee': results[i].receipt ? this.$web3.utils.fromWei(new BN(results[i].receipt.gasUsed).mul(new BN(results[i].transaction.gasPrice))) : '?',
                  'amount': this.$web3.utils.fromWei(results[i].transaction.value),
                })
              }
            }
            this.data = data
          });
        })
      },
      confirm (event) {
        this.$modal.open({
          parent: this,
          component: WalletConfirmSend,
          hasModalCard: true,
          props: {
            to: this.to,
            amount: this.amount,
            comment: this.comment,
          },
        })
      },
    },
    created () {
      var account = new MixAccount(this, this.$web3.eth.defaultAccount)
      account.init()
      .then(() => {
        QRCode.toDataURL(account.contractAddress, {
          mode: 'alphanumeric',
          errorCorrectionLevel: 'H'
        })
        .then(qrcode => {
          this.qrcode = qrcode
        })

        account.contract.events.Receive({
          toBlock: 'pending'
        })
        .on('data', event => {
          account.getBalance()
          .then(balance => {
            this.balance = this.$web3.utils.fromWei(balance) + ' MIX'
          })
        })

        this.loadData(account)

        this.$web3.eth.subscribe('newBlockHeaders')
        .on('data', block => {
          this.loadData(account)
        })
      })
    },
  }
</script>
