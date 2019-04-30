<template>
  <page>
    <template slot="title">
      {{ $t('browsingHistory') }}
    </template>

    <template slot="body">
      <b-table :data="data">
        <template slot-scope="props">
          <b-table-column field="when" label="Last access">
            <timeago :datetime="props.row.when" :autoUpdate="true"></timeago>
          </b-table-column>

          <b-table-column field="item" label="Item">
            <router-link :to="props.row.route">{{ props.row.title }}</router-link>
          </b-table-column>

          <b-table-column field="author" label="Author">
            <router-link :to="props.row.ownerRoute">{{ props.row.owner }}</router-link>
          </b-table-column>
        </template>
      </b-table>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'

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
      let data = []
      let count = await this.$db.get('/historyCount')
      for (var i = count - 1; i >= 0; i--) {
        try {
          let json = await this.$db.get('/history/' + i)
          var item = JSON.parse(json)
          data.push({
            timestamp: item.timestamp,
            when: new Date(item.timestamp),
            route: '/item/' + item.itemId,
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
