<template>
  <page>
    <template slot="title">
      {{ $t('Subscriptions.Subscriptions') }}
    </template>

    <template slot="body">
      <b-table :data="feeds">
        <template slot-scope="props">
          <b-table-column :label="$t('Subscriptions.Feed')">
            <router-link :to="props.row.route">{{ props.row.title }}</router-link>
          </b-table-column>
          <b-table-column label="">
            <span class="remove" @click="removeFeed" :data-itemid="props.row.itemId">{{ $t('Subscriptions.Remove') }}</span>
          </b-table-column>
        </template>
      </b-table>
      <b-table :data="topics">
        <template slot-scope="props">
          <b-table-column :label="$t('Subscriptions.Topic')">
            <router-link :to="props.row.route">{{ props.row.title }}</router-link>
          </b-table-column>
          <b-table-column label="">
            <span class="remove" @click="removeTopic" :data-topichash="props.row.topicHash">{{ $t('Subscriptions.Remove') }}</span>
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
      setTitle(this.$t('Subscriptions.Subscriptions'))
      this.loadData()
    },
    methods: {
      async loadData() {
        this.feeds = []
        this.$db.createValueStream({
          'gte': '/accountSubscribed/' + this.$activeAccount.get().contractAddress + '/',
          'lt': '/accountSubscribed/' + this.$activeAccount.get().contractAddress + '/z',
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
          'gte': '/accountTopicSubscribed/' + this.$activeAccount.get().contractAddress + '/',
          'lt': '/accountTopicSubscribed/' + this.$activeAccount.get().contractAddress + '/z',
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
        await this.$db.del('/accountSubscribed/' + this.$activeAccount.get().contractAddress + '/' + event.target.dataset.itemid)
        this.loadData()
      },
      async removeTopic(event) {
        await this.$db.del('/accountTopicSubscribed/' + this.$activeAccount.get().contractAddress + '/' + event.target.dataset.topichash)
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
