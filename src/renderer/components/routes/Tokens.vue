<template>
  <page>
    <template slot="title">
      {{ $t('Tokens.Tokens') }}
    </template>

    <template slot="body">
      <b-table :data="data">
        <template slot-scope="props">
          <b-table-column :label="$t('Tokens.Token')">
            <item-link :itemId="props.row.itemId"></item-link>
          </b-table-column>
          <b-table-column :label="$t('Tokens.Balance')" numeric>
            {{ props.row.balance }}
          </b-table-column>
          <b-table-column label="">
            <span class="remove" @click="remove" :data-itemid="props.row.itemId">{{ $t('Tokens.Remove') }}</span>
          </b-table-column>
        </template>
      </b-table>
    </template>
  </page>
</template>

<script lang="ts">
  import Page from '../Page.vue'
  import ItemLink from '../ItemLink.vue'
  import setTitle from '../../../lib/setTitle'

  export default {
    name: 'tokens',
    components: {
      Page,
      ItemLink,
    },
    data() {
      return {
        data: [],
      }
    },
    created() {
      setTitle(this.$t('Tokens.Tokens'))
      this.loadData()
    },
    methods: {
      async loadData() {
        this.data = []
        this.$db.createValueStream({
          'gte': '/accountPortfolio/' + this.$activeAccount.get().contractAddress + '/',
          'lt': '/accountPortfolio/' + this.$activeAccount.get().contractAddress + '/z',
        })
        .on('data', async (itemId: string) => {
          try {
            let address = await this.$mixClient.tokenItemRegistry.methods.getToken(itemId).call()
            let token = new this.$mixClient.web3.eth.Contract(require('../../../lib/contracts/MixCreatorToken.abi.json'), address)
    				let balance = this.$mixClient.formatWei(await token.methods.balanceOf(this.$activeAccount.get().contractAddress).call())

            this.data.push({
              itemId: itemId,
              balance: balance,
            })
          }
          catch (e) {}
        })
      },
      async remove(event: any) {
        await this.$db.del('/accountPortfolio/' + this.$activeAccount.get().contractAddress + '/' + event.target.dataset.itemid)
        this.loadData()
      }
    }
  }
</script>

<style scoped>
  .remove {
    cursor: pointer;
    user-select: none;
  }
</style>
