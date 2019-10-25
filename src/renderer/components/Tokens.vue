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
        <template slot="footer">
          <router-link class="footer-link" :to="{ name: 'tokens-create' }">{{ $t('Tokens.CreateToken') }}</router-link>
        </template>
      </b-table>
    </template>
  </page>
</template>

<script lang="ts">
  import Page from './Page.vue'
  import ItemLink from './ItemLink.vue'
  import setTitle from '../../lib/setTitle'

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
        let tokens = await this.$activeAccount.get().call(this.$mixClient.accountTokens, 'getAllItems')
        for (let itemId of tokens) {
          try {
            let address = await this.$mixClient.tokenRegistry.methods.getToken(itemId).call()
            let token = new this.$mixClient.web3.eth.Contract(require('../../lib/contracts/MixCreatorToken.abi.json'), address)
            let toBN = this.$mixClient.web3.utils.toBN
    				let balance = this.$mixClient.web3.utils.fromWei(toBN(await token.methods.balanceOf(this.$activeAccount.get().contractAddress).call()))

            this.data.push({
              itemId: itemId,
              balance: balance,
            })
          }
          catch (e) {}
        }
      },
      async remove(event) {
        await this.$activeAccount.get().sendData(this.$mixClient.accountTokens, 'removeItem', [event.target.dataset.itemid], 0, 'Remove token from portfolio')
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
