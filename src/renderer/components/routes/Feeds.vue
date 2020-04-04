<template>
  <page>
    <template slot="title">
      {{ $t('Feeds.MyFeeds') }}
    </template>

    <template slot="body">
      <b-table :data="data">
        <template slot-scope="props">
          <b-table-column :label="$t('Feeds.Feed')">
            <router-link :to="props.row.route">{{ props.row.title }}</router-link>
          </b-table-column>
        </template>
      </b-table>
    </template>
  </page>
</template>

<script lang="ts">
  import Vue from 'vue'
  import Page from '../Page.vue'
  import MixItem from '../../../lib/MixItem'
  import setTitle from '../../../lib/setTitle'
  import bs58 from 'bs58'

  export default Vue.extend({
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
      setTitle(this.$t('Feeds.MyFeeds'))

      let feeds = await this.$activeAccount.get().call(this.$mixClient.accountFeeds, 'getAllItems')
      for (let itemId of feeds) {
        try {
          let item = await new MixItem(this.$root, itemId).init()
          let revision = await item.latestRevision().load()

          this.data.push({
            title: revision.getTitle(),
            route: '/item/' + bs58.encode(Buffer.from(this.$mixClient.web3.utils.hexToBytes(itemId.substr(0, 50)))),
          })
        }
        catch (e) {}
      }
    }
  })
</script>
