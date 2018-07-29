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
          <b-field label="Balance">
            {{ balance }}
          </b-field>
          <b-field label="Unconfirmed Balance">
            {{ unconfirmedBalance }}
          </b-field>
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
          <b-table :data="data" :columns="columns" default-sort="timestamp" default-sort-direction="desc"></b-table>
        </div>

      </section>
    </main>
  </div>
</template>

<script>
  var QRCode = require('qrcode')
  import { bus } from '../main'
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
        unconfirmedBalance: '',
        to: '',
        amount: '',
        comment: '',
        data: [],
        columns: [
          {
            field: 'timestamp',
            sortable: true,
            visible: false,
          },
          {
            field: 'when',
            label: 'When',
          },
          {
            field: 'who',
            label: 'Who',
            renderHtml: true,
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

        account.getUnconfirmedBalance()
        .then(balance => {
          this.unconfirmedBalance = this.$web3.utils.fromWei(balance) + ' MIX'
        })

        var data = []

        this.$db.get('/account/contract/' + account.contractAddress + '/receivedCount')
        .then(count => {
          var payments = []

          for (var i = 0; i < count; i++) {
            payments.push(this.$db.get('/account/contract/' + account.contractAddress + '/received/' + i)
              .then(json => {
                var payment = JSON.parse(json)
                return this.$web3.eth.getTransaction(payment.transaction)
                .then(tx => {
                  return this.$web3.eth.getBlock(tx.blockNumber)
                  .then(block => {
                    payment.timestamp = block.timestamp
                  })
                  .catch(error => {})
                  .then(() => {
                    return payment
                  })
                })
              })
              .catch(error => {
                return
              })
            )
          }

          return Promise.all(payments)
        })
        .catch(error => {
          return []
        })
        .then(results => {
          for (var i = 0; i < results.length; i++) {
            if (results[i]) {
              data.push({
                'timestamp': results[i].timestamp ? results[i].timestamp : 4000000000,
                'when': results[i].timestamp ? new Date(results[i].timestamp * 1000).toLocaleString() : 'pending',
                'who': '<code>' + results[i].sender + '</code>',
                'amount': this.$web3.utils.fromWei(results[i].amount),
              })
            }
          }
          return this.$web3.eth.getTransactionCount(this.$web3.eth.defaultAccount)
        })
        .then(nonce => {
          var transactions = [];
          for (var i = 0; i < nonce; i++) {
            transactions.push(account.getTransactionInfo(i)
              .catch(err => {
                return false
              })
            )
          }
          Promise.all(transactions)
          .then(results => {
            for (var i = 0; i < results.length; i++) {
              if (results[i] && results[i].transaction.value != 0) {
                data.push({
                  'timestamp': results[i].block ? results[i].block.timestamp : 4000000000,
                  'when': results[i].block ? new Date(results[i].block.timestamp * 1000).toLocaleString() : 'pending',
                  'who': '<code>' + results[i].to + '</code>',
                  'amount': '-' + this.$web3.utils.fromWei(results[i].transaction.value),
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

        bus.$on('account-receive', accountAddress => {
          if (accountAddress == account.contractAddress) {
            this.loadData(account)
          }
        })

        this.$web3.eth.subscribe('newBlockHeaders')
        .on('data', block => {
          this.loadData(account)
        })

        this.loadData(account)
      })
    },
  }
</script>
