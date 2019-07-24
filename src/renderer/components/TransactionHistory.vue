<template>
  <page>
    <template slot="title">
      {{ $t('transactionHistory') }}
    </template>

    <template slot="body">
      <b-table :data="data">
        <template slot-scope="props">
          <b-table-column :label="$t('when')">
            <timeago v-if="props.row.confirmed" :datetime="props.row.when" :autoUpdate="true"></timeago>
            <span v-else>pending</span>
          </b-table-column>

          <b-table-column :label="$t('description')">
            {{ props.row.description }}
          </b-table-column>

          <b-table-column :label="$t('receiver')">
            <code>{{ props.row.receiver }}</code>
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
    async created() {
      setTitle(this.$t('transactionHistory'))
      if (!window.activeAccount) {
        return
      }
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
            'receiver': info.to,
            'fee': info.receipt ? this.$mixClient.web3.utils.fromWei(this.$mixClient.web3.utils.toBN(info.receipt.gasUsed * info.transaction.gasPrice)) : '?',
            'amount': this.$mixClient.web3.utils.fromWei(info.transaction.value),
          })
        }
        catch (e) {}
      }
      this.data = data
    },
  }
</script>
