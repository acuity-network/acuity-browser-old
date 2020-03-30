<template>
  <page>
    <template slot="title">
      {{ $t('TransactionHistory.TransactionHistory') }}
    </template>

    <template slot="body">
      <b-table :data="data" :row-class="(row, index) => (row.error == '') ? '' : 'error'">
        <template slot-scope="props">
          <b-table-column :label="$t('TransactionHistory.When')">
            <timeago v-if="props.row.confirmed" :datetime="props.row.when" :autoUpdate="true" :locale="$i18n.locale"></timeago>
            <span v-else>{{ $t('TransactionHistory.Pending') }}</span>
          </b-table-column>

          <b-table-column :label="$t('TransactionHistory.Description')">
            {{ props.row.description }}
          </b-table-column>

          <b-table-column :label="$t('TransactionHistory.Error')">
            {{ props.row.error }}
          </b-table-column>

          <b-table-column :label="$t('TransactionHistory.Fee')">
            {{ props.row.fee }}
          </b-table-column>

          <b-table-column :label="$t('TransactionHistory.Amount')" numeric>
            {{ props.row.amount }}
          </b-table-column>
        </template>
      </b-table>
    </template>
  </page>
</template>

<script lang="ts">
  import Page from '../Page.vue'
  import setTitle from '../../../lib/setTitle'

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
        let nonce = await this.$mixClient.web3.eth.getTransactionCount(this.$activeAccount.get().controllerAddress)
        let data: any[] = []
        for (let i = nonce; i >= 0; i--) {
          try {
            let info = await this.$activeAccount.get().getTransactionInfo(i)
            data.push({
              'confirmed': info.receipt !== null,
              'when': info.receipt ? new Date(info.block.timestamp * 1000) : null,
              'description': info.description,
              'error': info.error ? info.error : '',
              'fee': info.receipt ? this.$mixClient.web3.utils.fromWei(this.$mixClient.web3.utils.toBN(info.receipt.gasUsed * info.transaction.gasPrice)) : '?',
              'amount': this.$mixClient.formatWei(info.transaction.value),
            })
          }
          catch (e) {}
        }
        this.data = data
      },
    },
    async created() {
      setTitle(this.$t('TransactionHistory.TransactionHistory'))
      if (!this.$activeAccount.get()) {
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
