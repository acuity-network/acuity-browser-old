<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">Transaction history</h1>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <b-table :data="data" :columns="columns" default-sort="nonce" default-sort-direction="desc"></b-table>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
  export default {
    name: 'transaction-history',
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
