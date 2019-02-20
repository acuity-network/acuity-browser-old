<template>
  <page>
    <template slot="title">
      Wallet
    </template>

    <template slot="body">
      <div class="is-clearfix">
        <img class="qr is-pulled-right" :src="qrcode" />

        <b-field label="Balance">
          {{ balance }}
        </b-field>
        <b-field label="Unconfirmed Balance">
          {{ unconfirmedBalance }}
        </b-field>
      </div>

      <b-tabs>
        <b-tab-item label="Transactions">
          <b-table :data="data" default-sort="timestamp" default-sort-direction="desc">
            <template slot-scope="props">
              <b-table-column field="timestamp" :visible="false" sortable>
                {{ props.row.timestamp }}
              </b-table-column>

              <b-table-column label="When">
                <timeago v-if="props.row.confirmed" :datetime="props.row.when" :autoUpdate="true"></timeago>
                <span v-else>pending</span>
              </b-table-column>

              <b-table-column label="Who">
                <code>{{ props.row.who }}</code>
              </b-table-column>

              <b-table-column label="Amount" numeric>
                {{ props.row.amount }}
              </b-table-column>
            </template>
          </b-table>
        </b-tab-item>

        <b-tab-item label="Send">
          <b-field label="To">
            <b-input v-model="to"></b-input>
          </b-field>
          <b-field label="Amount">
            <b-input v-model="amount"></b-input>
          </b-field>
          <button type="submit" class="button is-primary" v-on:click="confirm">Send</button>
        </b-tab-item>
      </b-tabs>
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
                'confirmed': results[i].timestamp != null,
                'when': results[i].timestamp ? new Date(results[i].timestamp * 1000) : null,
                'who': results[i].sender,
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
              if (results[i] && results[i].transaction && results[i].transaction.value != 0) {
                data.push({
                  'timestamp': results[i].block ? results[i].block.timestamp : 4000000000,
                  'confirmed': results[i].block != null,
                  'when': results[i].block ? new Date(results[i].block.timestamp * 1000) : null,
                  'who': results[i].to,
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

<style scoped>
  .qr {
    image-rendering: pixelated;
    width: 256px;
    height: 256px;
  }
</style>
