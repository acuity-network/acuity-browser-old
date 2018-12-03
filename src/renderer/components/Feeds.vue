<template>
  <page>
    <template slot="title">
      Feeds
    </template>

    <template slot="body">
      <b-table :data="data">
        <template slot-scope="props">
          <b-table-column label="Feed">
            <router-link :to="props.row.route">{{ props.row.title }}</router-link>
          </b-table-column>
        </template>
      </b-table>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import MixItem from '../../lib/MixItem.js'

  export default {
    name: 'feeds',
    components: {
      Page,
    },
    data() {
      return {
        data: [],
      }
    },
    created() {
      this.$db.createValueStream({
        'gte': '/accountFeeds/' + window.activeAccount.contractAddress + '/',
        'lt': '/accountFeeds/' + window.activeAccount.contractAddress + '/z',
      })
      .on('data', async itemId => {
        try {
          let item = await new MixItem(this.$root, itemId).init()
          let revision = await item.latestRevision().load()

          this.data.push({
            title: revision.getTitle(),
            route: '/item/' + itemId,
          })
        }
        catch (e) {}
      })
    }
  }
</script>
