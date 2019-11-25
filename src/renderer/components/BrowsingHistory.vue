<template>
  <page>
    <template slot="title">
      {{ $t('BrowsingHistory.BrowsingHistory') }}
    </template>

    <template slot="body">
      <b-table :data="data">
        <template slot-scope="props">
          <b-table-column field="when" :label="$t('BrowsingHistory.LastAccess')">
            <timeago :datetime="props.row.when" :autoUpdate="true"></timeago>
          </b-table-column>

          <b-table-column field="item" :label="$t('BrowsingHistory.Item')">
            <router-link :to="props.row.route">{{ props.row.title }}</router-link>
          </b-table-column>

          <b-table-column field="author" :label="$t('BrowsingHistory.Author')">
            <router-link :to="props.row.ownerRoute">{{ props.row.owner }}</router-link>
          </b-table-column>
        </template>
      </b-table>
    </template>
  </page>
</template>

<script lang="ts">
  import Page from './Page.vue'
  import setTitle from '../../lib/setTitle'
  import bs58 from 'bs58'

  export default {
    name: 'browsing-history',
    components: {
      Page,
    },
    data() {
      return {
        data: [],
      }
    },
    async created() {
      setTitle(this.$t('BrowsingHistory.BrowsingHistory'))
      let data = []
      let count = await this.$db.get('/historyCount')
      for (let i = count - 1; i >= 0; i--) {
        try {
          let json = await this.$db.get('/history/' + i)
          let item = JSON.parse(json)
          data.push({
            timestamp: item.timestamp,
            when: new Date(item.timestamp),
            route: '/item/' + bs58.encode(Buffer.from(this.$mixClient.web3.utils.hexToBytes(item.itemId.substr(0, 50)))),
            title: item.title,
            owner: item.owner ? item.owner : '',
            ownerRoute: item.ownerRoute ? item.ownerRoute : '',
          })
        }
        catch (e) {}
      }
      this.data = data
    },
  }
</script>
