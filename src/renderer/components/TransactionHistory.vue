<template>
  <page>
    <template slot="title">
      {{ $t('transactionHistory') }}
    </template>

    <template slot="body">
      <b-table :data="data" :row-class="(row, index) => (row.error == '') ? '' : 'error'">
        <template slot-scope="props">
          <b-table-column :label="$t('when')">
            <timeago v-if="props.row.confirmed" :datetime="props.row.when" :autoUpdate="true"></timeago>
            <span v-else>pending</span>
          </b-table-column>

          <b-table-column :label="$t('description')">
            {{ props.row.description }}
          </b-table-column>

          <b-table-column :label="$t('error')">
            {{ props.row.error }}
          </b-table-column>

          <b-table-column :label="$t('fee')">
            {{ props.row.fee }}
          </b-table-column>

          <b-table-column :label="$t('amount')" numeric>
            {{ props.row.amount }}
          </b-table-column>
        </template>
      </b-table>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'transaction-history',
    components: {
      Page,
    },
    data() {
      return {
        data: [],
      }
    },
    methods: {
      async loadData() {
        let nonce = await this.$mixClient.web3.eth.getTransactionCount(window.activeAccount.controllerAddress)
        let transactions = []
        let data = []
        for (let i = nonce; i >= 0; i--) {
          try {
            let info = await window.activeAccount.getTransactionInfo(i)
            data.push({
              'confirmed': info.receipt !== null,
              'when': info.receipt ? new Date(info.block.timestamp * 1000) : null,
              'description': info.description,
              'error': info.error ? info.error : '',
              'fee': info.receipt ? this.$mixClient.web3.utils.fromWei(this.$mixClient.web3.utils.toBN(info.receipt.gasUsed * info.transaction.gasPrice)) : '?',
              'amount': this.$mixClient.web3.utils.fromWei(info.transaction.value),
            })
          }
          catch (e) {}
        }
        this.data = data
      },
    },
    async created() {
      setTitle(this.$t('transactionHistory'))
      if (!window.activeAccount) {
        return
      }

      this.newBlockHeadersEmitter = this.$mixClient.web3.eth.subscribe('newBlockHeaders')
      .on('data', block => {
        this.loadData()
      })

      this.loadData()
    },
    destroyed() {
      this.newBlockHeadersEmitter.unsubscribe()
    },
  }
</script>

<style scoped>

  tr.error td {
    background-color: #660000;
  }

</style>
