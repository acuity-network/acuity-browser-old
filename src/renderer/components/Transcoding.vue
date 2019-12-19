<template>
  <page>
    <template slot="title">
      {{ $t('Transcoding.Transcoding') }}
    </template>

    <template slot="body">
      <b-table :data="data">
        <template slot-scope="props">
          <b-table-column :label="$t('Transcoding.Item')">
            <item-link :itemId="props.row.itemId"></item-link>
          </b-table-column>
          <b-table-column :label="$t('Transcoding.Width')">
            {{ props.row.width }}
          </b-table-column>
          <b-table-column :label="$t('Transcoding.Height')">
            {{ props.row.height }}
          </b-table-column>
          <b-table-column>
            <a @click="deleteJob" :data-key="props.row.key">delete</a>
          </b-table-column>
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
    name: 'transcoding',
    components: {
      Page,
      ItemLink,
    },
    data() {
      return {
        data: [],
      }
    },
    async created() {
      setTitle(this.$t('Transcoding.Transcoding'))
      this.loadData()
    },
    methods: {
      loadData() {
        this.data = []

        this.$db.createReadStream({
          'gt': '/transcode/',
          'lt': '/transcode/z',
        })
        .on('data', transcode => {
          let row = JSON.parse(transcode.value)
          row.key = transcode.key
          this.data.push(row)
        })
      },
      async deleteJob(event) {
        await this.$db.del(event.target.dataset.key)
        this.loadData()
      }
    },
  }
</script>
