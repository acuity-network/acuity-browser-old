<template>
  <page>
    <template slot="title">
      {{ $t('tokens') }}
    </template>

    <template slot="body">
      <b-table :data="data">
        <template slot-scope="props">
          <b-table-column label="Token">
            <router-link :to="props.row.route">{{ props.row.title }}</router-link>
          </b-table-column>
          <b-table-column label="">
            <span class="remove" @click="remove" :data-itemid="props.row.itemId">remove</span>
          </b-table-column>
        </template>
      </b-table>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import MixItem from '../../lib/MixItem.js'
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'tokens',
    components: {
      Page,
    },
    data() {
      return {
        data: [],
      }
    },
    created() {
      setTitle(this.$t('tokens'))
      this.loadData()
    },
    methods: {
      async loadData() {
        this.data = []
        this.$db.createValueStream({
          'gte': '/accountPortfolio/' + window.activeAccount.contractAddress + '/',
          'lt': '/accountPortfolio/' + window.activeAccount.contractAddress + '/z',
        })
        .on('data', async itemId => {
          try {
            let item = await new MixItem(this.$root, itemId).init()
            let revision = await item.latestRevision().load()

            this.data.push({
              title: revision.getTitle(),
              route: '/item/' + itemId,
              itemId: itemId,
            })
          }
          catch (e) {}
        })
      },
      async remove(event) {
        await this.$db.del('/accountPortfolio/' + window.activeAccount.contractAddress + '/' + event.target.dataset.itemid)
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
