<template>
  <page>
    <template slot="title">
      Wallet
    </template>

    <template slot="body">
      <img class="qr" :src="qrcode" />
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
      <button type="submit" class="button is-primary" v-on:click="confirm">Send</button>

      <b-table :data="data" :columns="columns" default-sort="timestamp" default-sort-direction="desc"></b-table>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  var QRCode = require('qrcode')
  import WalletConfirmSend from './WalletConfirmSend.vue'

  export default {
    name: 'wallet',
    components: {
      Page,
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
      loadData() {
        var BN = this.$web3.utils.BN

        window.activeAccount.getBalance()
        .then(balance => {
          this.balance = this.$web3.utils.fromWei(balance) + ' MIX'
        })

        window.activeAccount.getUnconfirmedBalance()
        .then(balance => {
          this.unconfirmedBalance = this.$web3.utils.fromWei(balance) + ' MIX'
        })

        var data = []

        this.$db.get('/account/contract/' + window.activeAccount.contractAddress + '/receivedCount')
        .then(count => {
          var payments = []

          for (var i = 0; i < count; i++) {
            payments.push(this.$db.get('/account/contract/' + window.activeAccount.contractAddress + '/received/' + i)
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
          return this.$web3.eth.getTransactionCount(window.activeAccount.controllerAddress)
        })
        .then(nonce => {
          var transactions = []
          for (var i = 0; i < nonce; i++) {
            transactions.push(window.activeAccount.getTransactionInfo(i)
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
          },
        })
      },
    },
    async created() {
      if (!window.activeAccount) {
        return
      }
      this.qrcode = await QRCode.toDataURL(window.activeAccount.contractAddress, {
        mode: 'alphanumeric',
        errorCorrectionLevel: 'H',
        scale: 1,
      })

      this.$root.$on('account-receive', accountAddress => {
        if (accountAddress == window.activeAccount.contractAddress) {
          this.loadData()
        }
      })

      this.$web3.eth.subscribe('newBlockHeaders')
      .on('data', block => {
        this.loadData()
      })

      this.loadData()
    },
  }
</script>

<style>
  img.qr {
    image-rendering: pixelated;
    width: 256px;
    height: 256px;
  }
</style>
