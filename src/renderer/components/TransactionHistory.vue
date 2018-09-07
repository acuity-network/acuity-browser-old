<template>
  <page>
    <template slot="title">
      Transaction History
    </template>

    <template slot="body">
      <b-table :data="data" :columns="columns" default-sort="nonce" default-sort-direction="desc"></b-table>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'

  export default {
    name: 'transaction-history',
    components: {
      Page,
    },
    data() {
      return {
        data: [],
        columns: [
          {
            field: 'nonce',
            sortable: true,
            visible: false,
          },
          {
            field: 'when',
            label: 'When',
          },
          {
            field: 'description',
            label: 'Description',
          },
          {
            field: 'receiver',
            label: 'Receiver',
            renderHtml: true,
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
    created() {
      if (!window.activeAccount) {
        return
      }
      this.$web3.eth.getTransactionCount(window.activeAccount.controllerAddress)
      .then(nonce => {
        var transactions = []
        for (var i = nonce; i >= 0; i--) {
          window.activeAccount.getTransactionInfo(i)
          .then(info => {
            this.data.push({
              'nonce': info.transaction.nonce,
              'when': info.block ? new Date(info.block.timestamp * 1000).toLocaleString() : 'pending',
              'description': info.description,
              'receiver': '<code>' + info.to + '</code>',
              'fee': info.receipt ? info.receipt.gasUsed * info.transaction.gasPrice : '?',
              'amount': this.$web3.utils.fromWei(info.transaction.value),
            })
          })
          .catch(err => {})
        }
      })
    },
  }
</script>
