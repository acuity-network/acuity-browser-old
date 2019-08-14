<template>
  <b-table :data="data" default-sort="amount" default-sort-direction="asc">
    <template slot-scope="props">
      <b-table-column field="holder" :label="$t('holder')" sortable>
        <profile-link :address="props.row.holder" :key="props.row.holder"></profile-link>
      </b-table-column>

      <b-table-column field="amount" :label="$t('amount')" numeric sortable>
        {{ props.row.amount }}
      </b-table-column>
    </template>
  </b-table>
</template>

<script lang="ts">
  import ProfileLink from './ProfileLink.vue'

  export default {
    name: 'token-holders',
    components: {
      ProfileLink,
    },
    props: {
      address: {
        type: String,
        required: true,
      },
    },
    data() {
      return {
        data: [],
      }
    },
    async created() {
      this.token = new this.$mixClient.web3.eth.Contract(require('../../lib/contracts/CreatorToken.abi.json'), this.address)

      let accountBalances = await this.token.methods.getAccountBalances().call()
      let data = []
      for (let i in accountBalances.accounts) {
        data.push({
          holder: accountBalances.accounts[i],
          amount: this.$mixClient.web3.utils.fromWei(this.$mixClient.web3.utils.toBN(accountBalances.balances[i])),
        })
      }
      this.data = data
    },
  }
</script>
