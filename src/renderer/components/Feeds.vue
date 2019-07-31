<template>
  <page>
    <template slot="title">
      {{ $t('myFeeds') }}
    </template>

    <template slot="body">
      <b-table :data="data">
        <template slot-scope="props">
          <b-table-column :label="$t('feeds')">
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
  import setTitle from '../../lib/setTitle.js'

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
    async created() {
      setTitle(this.$t('myFeeds'))

      let feeds = await window.activeAccount.call(this.$mixClient.accountFeeds, 'getAllItems')
      for (let itemId of feeds) {
        try {
          let item = await new MixItem(this.$root, itemId).init()
          let revision = await item.latestRevision().load()

          this.data.push({
            title: revision.getTitle(),
            route: '/item/' + itemId,
          })
        }
        catch (e) {}
      }
    }
  }
</script>
