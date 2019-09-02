<template>
  <page>
    <template slot="title">
      {{ $t('subscriptions') }}
    </template>

    <template slot="body">
      <b-table :data="feeds">
        <template slot-scope="props">
          <b-table-column label="Feed">
            <router-link :to="props.row.route">{{ props.row.title }}</router-link>
          </b-table-column>
          <b-table-column label="">
            <span class="remove" @click="removeFeed" :data-itemid="props.row.itemId">remove</span>
          </b-table-column>
        </template>
      </b-table>
      <b-table :data="topics">
        <template slot-scope="props">
          <b-table-column label="Topic">
            <router-link :to="props.row.route">{{ props.row.title }}</router-link>
          </b-table-column>
          <b-table-column label="">
            <span class="remove" @click="removeTopic" :data-topichash="props.row.topicHash">remove</span>
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
    name: 'subscriptions',
    components: {
      Page,
    },
    data() {
      return {
        feeds: [],
        topics: [],
      }
    },
    created() {
      setTitle(this.$t('subscriptions'))
      this.loadData()
    },
    methods: {
      async loadData() {
        this.feeds = []
        this.$db.createValueStream({
          'gte': '/accountSubscribed/' + window.activeAccount.contractAddress + '/',
          'lt': '/accountSubscribed/' + window.activeAccount.contractAddress + '/z',
        })
        .on('data', async itemId => {
          try {
            let item = await new MixItem(this.$root, itemId).init()
            let revision = await item.latestRevision().load()

            this.feeds.push({
              title: revision.getTitle(),
              route: '/item/' + itemId,
              itemId: itemId,
            })
          }
          catch (e) {}
        })
        this.topics = []
        this.$db.createValueStream({
          'gte': '/accountTopicSubscribed/' + window.activeAccount.contractAddress + '/',
          'lt': '/accountTopicSubscribed/' + window.activeAccount.contractAddress + '/z',
        })
        .on('data', async topicHash => {
          try {
            this.topics.push({
              title: await this.$mixClient.itemTopics.methods.getTopic(topicHash).call(),
              route: '/topic/' + topicHash,
              topicHash: topicHash,
            })
          }
          catch (e) {}
        })
      },
      async removeFeed(event) {
        await this.$db.del('/accountSubscribed/' + window.activeAccount.contractAddress + '/' + event.target.dataset.itemid)
        this.loadData()
      },
      async removeTopic(event) {
        await this.$db.del('/accountTopicSubscribed/' + window.activeAccount.contractAddress + '/' + event.target.dataset.topichash)
        this.loadData()
      },
    }
  }
</script>

<style scoped>
  .remove {
    cursor: pointer;
    user-select: none;
  }
</style>
