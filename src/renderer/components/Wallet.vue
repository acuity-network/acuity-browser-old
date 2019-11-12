<template>
  <page>
    <template slot="title">
      {{ $t('Wallet.Wallet') }}
    </template>

    <template slot="body">
      <div class="is-clearfix">
        <img class="qr is-pulled-right" :src="qrcode" />

        <b-field :label="$t('Wallet.Balance')">
          {{ balance }} MIX
        </b-field>
        <b-field :label="$t('Wallet.UnconfirmedBalance')">
          {{ unconfirmedBalance }} MIX
        </b-field>
        <b-field :label="$t('Wallet.Address')">
          <code>{{ address }}</code>
        </b-field>
      </div>

      <b-tabs>
        <b-tab-item :label="$t('Wallet.Transactions')">
          <b-table :data="data" :row-class="(row, index) => (row.amount < 0) ? 'send' : 'receive'" default-sort="timestamp" default-sort-direction="desc">
            <template slot-scope="props">
              <b-table-column field="timestamp" :visible="false" sortable>
                {{ props.row.timestamp }}
              </b-table-column>

              <b-table-column :label="$t('Wallet.When')">
                <timeago v-if="props.row.confirmed" :datetime="props.row.when" :autoUpdate="true"></timeago>
                <span v-else>pending</span>
              </b-table-column>

              <b-table-column :label="$t('Wallet.Address')">
                <code>{{ props.row.who }}</code>
              </b-table-column>

              <b-table-column :label="$t('Wallet.Amount')" numeric>
                {{ props.row.amount }}
              </b-table-column>
            </template>
          </b-table>
        </b-tab-item>

        <b-tab-item :label="$t('Wallet.Send')">
          <template v-if="!isConfirm">
            <b-field :label="$t('Wallet.To')" :type="{ 'is-danger': toError }" :message="toError">
              <b-input v-model.trim="to" @input="checkTo" placeholder="0x0000000000000000000000000000000000000000"></b-input>
            </b-field>
            <b-field v-if="!isSendAll" :label="$t('Wallet.Amount')" :type="{ 'is-danger': amountError }" :message="amountError">
              <b-input v-model="amount" @input="checkAmount"></b-input>
            </b-field>
            <b-field :message="$t('Wallet.SendAllMessage')">
              <b-checkbox v-model="isSendAll">
                {{ $t('Wallet.SendAll') }}
              </b-checkbox>
            </b-field>
            <button type="submit" class="button is-primary" @click="send">{{ $t('Wallet.Send') }}</button>
          </template>
          <template v-else>
            <b-field :label="$t('Wallet.To')">
              <code>{{ to }}</code>
            </b-field>
            <b-field :label="$t('Wallet.Amount')">
              {{ amount }} MIX
            </b-field>
            <button type="button" class="button is-primary" @click="confirm">{{ $t('Wallet.Confirm') }}</button>
            <button type="button" class="button" @click="cancel">{{ $t('Wallet.Cancel') }}</button>
          </template>
        </b-tab-item>
      </b-tabs>
    </template>
  </page>
</template>

<script lang="ts">
  import Page from './Page.vue'
  import QRCode from 'qrcode'
  import setTitle from '../../lib/setTitle'

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
        this.balance = this.$mixClient.formatWei(await this.$activeAccount.get().getBalance())
        this.unconfirmedBalance = this.$mixClient.formatWei(await this.$activeAccount.get().getUnconfirmedBalance())
        let data = []

        let count = 0
        try {
          count = await this.$db.get('/account/contract/' + this.$activeAccount.get().contractAddress + '/receivedCount')
        }
        catch (e) {}
        let payments = []

        for (let i = 0; i < count; i++) {
          payments.push(this.$db.get('/account/contract/' + this.$activeAccount.get().contractAddress + '/received/' + i)
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
                'amount': this.$mixClient.formatWei(results[i].amount),
              })
            } catch (e) {}
          }
        }
        let nonce = await this.$mixClient.web3.eth.getTransactionCount(this.$activeAccount.get().controllerAddress)
        results = []
        for (let i = 0; i < nonce; i++) {
          results.push(await this.$activeAccount.get().getTransactionInfo(i)
            .catch(err => {
              return false
            })
          )
        }
        for (let i = 0; i < results.length; i++) {
          if (results[i] && results[i].transaction && results[i].transaction.value != 0) {
            data.push({
              'timestamp': results[i].block ? results[i].block.timestamp : 4000000000,
              'confirmed': results[i].block != null,
              'when': results[i].block ? new Date(results[i].block.timestamp * 1000) : null,
              'who': results[i].to,
              'amount': '-' + this.$mixClient.formatWei(results[i].transaction.value),
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

        let error = false
        if (!this.$mixClient.web3.utils.isAddress(this.to)) {
          this.toError = this.$t('Wallet.InvalidAddress')
          error = true
        }

        if (this.isSendAll) {
          let balance = toBN(await this.$activeAccount.get().getControllerBalance())
          let gas = await this.$activeAccount.get().getSendMixGas(this.to, balance) + 200000
          this.amount = this.$mixClient.web3.utils.fromWei(balance.sub(toBN(gas).mul(toBN('1000000000'))))
        }
        else {
          try {
            if (toBN(this.$mixClient.web3.utils.toWei(this.amount)).lte(toBN(0))) {
              throw null
            }
          }
          catch (e) {
            this.amountError = this.$t('Wallet.InvalidAmount')
            error = true
          }
        }

        if (!error) {
          this.isConfirm = true
        }
      },
      async cancel(event) {
        if (this.isSendAll) {
          this.amount = ''
        }
        this.isConfirm = false
      },
      async confirm(event) {
        await this.$activeAccount.get().sendMix(this.to, this.$mixClient.web3.utils.toWei(this.amount))
        this.loadData()
        this.to = ''
        this.amount = ''
        this.isSendAll = false
        this.isConfirm = false
      },
      accountReceive(accountAddress) {
        if (accountAddress == this.$activeAccount.get().contractAddress) {
          this.loadData()
        }
      },
    },
    async created() {
      setTitle(this.$t('Wallet.Wallet'))
      if (!this.$activeAccount.get()) {
        return
      }
      this.address = this.$activeAccount.get().contractAddress
      this.qrcode = await QRCode.toDataURL(this.$activeAccount.get().contractAddress, {
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
