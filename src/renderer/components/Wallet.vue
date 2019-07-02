<template>
  <page>
    <template slot="title">
      {{ $t('wallet') }}
    </template>

    <template slot="body">
      <div class="is-clearfix">
        <img class="qr is-pulled-right" :src="qrcode" />

        <b-field :label="$t('balance')">
          {{ balance }} MIX
        </b-field>
        <b-field :label="$t('unconfirmedBalance')">
          {{ unconfirmedBalance }} MIX
        </b-field>
        <b-field label="Address">
          <code>{{ address }}</code>
        </b-field>
      </div>

      <b-tabs>
        <b-tab-item :label="$t('transactions')">
          <b-table :data="data" :row-class="(row, index) => (row.amount < 0) ? 'send' : 'receive'" default-sort="timestamp" default-sort-direction="desc">
            <template slot-scope="props">
              <b-table-column field="timestamp" :visible="false" sortable>
                {{ props.row.timestamp }}
              </b-table-column>

              <b-table-column :label="$t('when')">
                <timeago v-if="props.row.confirmed" :datetime="props.row.when" :autoUpdate="true"></timeago>
                <span v-else>pending</span>
              </b-table-column>

              <b-table-column label="Address">
                <code>{{ props.row.who }}</code>
              </b-table-column>

              <b-table-column :label="$t('amount')" numeric>
                {{ props.row.amount }}
              </b-table-column>
            </template>
          </b-table>
        </b-tab-item>

        <b-tab-item :label="$t('send')">
          <template v-if="!isConfirm">
            <b-field :label="$t('to')" :type="{ 'is-danger': toError }" :message="toError">
              <b-input v-model="to" @input="checkTo" placeholder="0x0000000000000000000000000000000000000000"></b-input>
            </b-field>
            <b-field v-if="!isSendAll" :label="$t('amount')" :type="{ 'is-danger': amountError }" :message="amountError">
              <b-input v-model="amount" @input="checkAmount"></b-input>
            </b-field>
            <b-field message="Send all account funds to the destination.">
              <b-checkbox v-model="isSendAll">
                Send all
              </b-checkbox>
            </b-field>
            <button type="submit" class="button is-primary" @click="send">{{ $t('send') }}</button>
          </template>
          <template v-else>
            <b-field :label="$t('to')">
              <code>{{ to }}</code>
            </b-field>
            <b-field :label="$t('amount')">
              {{ amount }} MIX
            </b-field>
            <button type="button" class="button is-primary" @click="confirm">Confirm</button>
            <button type="button" class="button" @click="cancel">Cancel</button>
          </template>
        </b-tab-item>
      </b-tabs>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import QRCode from 'qrcode'
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'wallet',
    components: {
      Page,
    },
    data() {
      return {
        qrcode: '',
        address: '',
        balance: '',
        unconfirmedBalance: '',
        to: '',
        toError: '',
        amount: '',
        amountError: '',
        isSendAll: false,
        isConfirm: false,
        data: [],
      }
    },
    methods: {
      async loadData() {
        let balance = await window.activeAccount.getBalance()
        this.balance = this.$mixClient.web3.utils.fromWei(balance)
        balance = await window.activeAccount.getUnconfirmedBalance()
        this.unconfirmedBalance = this.$mixClient.web3.utils.fromWei(balance)
        let data = []

        let count = await this.$db.get('/account/contract/' + window.activeAccount.contractAddress + '/receivedCount')
        let payments = []

        for (let i = 0; i < count; i++) {
          payments.push(this.$db.get('/account/contract/' + window.activeAccount.contractAddress + '/received/' + i)
            .then(async json => {
              let payment = JSON.parse(json)
              let tx = await this.$mixClient.web3.eth.getTransaction(payment.transaction)
              let block = await this.$mixClient.web3.eth.getBlock(tx.blockNumber)
              payment.timestamp = block.timestamp
              return payment
            })
            .catch(error => {})
          )
        }

        let results = await Promise.all(payments)
        for (let i = 0; i < results.length; i++) {
          if (results[i]) {
            try {
              data.push({
                'timestamp': results[i].timestamp ? results[i].timestamp : 4000000000,
                'confirmed': results[i].timestamp != null,
                'when': results[i].timestamp ? new Date(results[i].timestamp * 1000) : null,
                'who': results[i].sender,
                'amount': this.$mixClient.web3.utils.fromWei(results[i].amount),
              })
            } catch (e) {}
          }
        }
        let nonce = await this.$mixClient.web3.eth.getTransactionCount(window.activeAccount.controllerAddress)
        let transactions = []
        for (let i = 0; i < nonce; i++) {
          transactions.push(window.activeAccount.getTransactionInfo(i)
            .catch(err => {
              return false
            })
          )
        }
        results = await Promise.all(transactions)
        for (let i = 0; i < results.length; i++) {
          if (results[i] && results[i].transaction && results[i].transaction.value != 0) {
            data.push({
              'timestamp': results[i].block ? results[i].block.timestamp : 4000000000,
              'confirmed': results[i].block != null,
              'when': results[i].block ? new Date(results[i].block.timestamp * 1000) : null,
              'who': results[i].to,
              'amount': '-' + this.$mixClient.web3.utils.fromWei(results[i].transaction.value),
            })
          }
        }
        this.data = data
      },
      checkTo(event) {
        if (this.$mixClient.web3.utils.isAddress(this.to)) {
          this.toError = ''
        }
      },
      checkAmount(event) {
        let toBN = this.$mixClient.web3.utils.toBN
        try {
          if (toBN(this.$mixClient.web3.utils.toWei(this.amount)).lte(toBN(0))) {
            throw null
          }
        }
        catch (e) {
          return
        }
        this.amountError = ''
      },
      async send(event) {
        let toBN = this.$mixClient.web3.utils.toBN
        this.to = this.to.trim()

        let error = false
        if (!this.$mixClient.web3.utils.isAddress(this.to)) {
          this.toError = 'Invalid address.'
          error = true
        }

        if (this.isSendAll) {
          let balance = toBN(await window.activeAccount.getControllerBalance())
          let gas = await window.activeAccount.getSendMixGas(this.to, balance) + 200000
          this.amount = this.$mixClient.web3.utils.fromWei(balance.sub(toBN(gas).mul(toBN('1000000000'))))
        }
        else {
          try {
            if (toBN(this.$mixClient.web3.utils.toWei(this.amount)).lte(toBN(0))) {
              throw null
            }
          }
          catch (e) {
            this.amountError = 'Invalid amount.'
            error = true
          }
        }

        if (error) {
          return false
        }

        this.isConfirm = true
      },
      async cancel(event) {
        if (this.isSendAll) {
          this.amount = ''
        }
        this.isConfirm = false
      },
      async confirm(event) {
        await window.activeAccount.sendMix(this.to, this.$mixClient.web3.utils.toWei(this.amount))
        this.loadData()
        this.to = ''
        this.amount = ''
        this.isSendAll = false
        this.isConfirm = false
      },
      accountReceive(accountAddress) {
        if (accountAddress == window.activeAccount.contractAddress) {
          this.loadData()
        }
      },
    },
    async created() {
      setTitle(this.$t('wallet'))
      if (!window.activeAccount) {
        return
      }
      this.address = window.activeAccount.contractAddress
      this.qrcode = await QRCode.toDataURL(window.activeAccount.contractAddress, {
        mode: 'alphanumeric',
        errorCorrectionLevel: 'H',
        scale: 1,
      })

      this.$root.$on('account-receive', this.accountReceive)

      this.newBlockHeadersEmitter = this.$mixClient.web3.eth.subscribe('newBlockHeaders')
      .on('data', block => {
        this.loadData()
      })

      this.loadData()
    },
    destroyed() {
      this.newBlockHeadersEmitter.unsubscribe()
      this.$root.$off('account-receive', this.accountReceive)
    },
  }
</script>

<style scoped>
  .qr {
    image-rendering: pixelated;
    width: 256px;
    height: 256px;
    cursor: none;
  }

  tr.receive td {
    background-color: #013220;
  }

  tr.send td {
    background-color: #660000;
  }

  code {
    background-color: transparent;
  }

</style>
