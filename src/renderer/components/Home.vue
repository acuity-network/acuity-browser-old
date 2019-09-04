<template>
  <main>
    <view-item v-for="itemId in itemIds" :short="true" :itemId="itemId" :key="itemId"></view-item>
  </main>
</template>

<script>
  import Page from './Page.vue'
  import ViewItem from './ViewItem.vue'
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'home',
    components: {
      Page,
      ViewItem,
    },
    data() {
      return {
        itemIds: [],
      }
    },
    async created() {
      setTitle(this.$t('home'))
      let feedIds = []
      let topicHashes = []

      let feedsPromise = new Promise((resolve, reject) => {
        this.$db.createValueStream({
          'gte': '/accountSubscribed/' + window.activeAccount.contractAddress + '/',
          'lt': '/accountSubscribed/' + window.activeAccount.contractAddress + '/z',
        })
        .on('data', feedId => {
          feedIds.push(feedId)
        })
        .on('end', async () => {
          resolve()
        })
      })

      let topicsPromise = new Promise((resolve, reject) => {
        this.$db.createValueStream({
          'gte': '/accountTopicSubscribed/' + window.activeAccount.contractAddress + '/',
          'lt': '/accountTopicSubscribed/' + window.activeAccount.contractAddress + '/z',
        })
        .on('data', topicHash => {
          topicHashes.push(topicHash)
        })
        .on('end', async () => {
          resolve()
        })
      })

      await Promise.all([feedsPromise, topicsPromise])

      let subscriptions = []
      for (let feedId of feedIds) {
        let count = await this.$mixClient.itemDagFeedItems.methods.getChildCount(feedId).call()
        if (count > 0) {
          let itemId = await this.$mixClient.itemDagFeedItems.methods.getChildId(feedId, count - 1).call()
          let timestamp = await this.$mixClient.itemStoreIpfsSha256.methods.getRevisionTimestamp(itemId, 0).call()
          subscriptions.push({
            type: 'feed',
            feedId: feedId,
            offset: count - 1,
            itemId: itemId,
            timestamp: (timestamp != 0) ? timestamp : 2000000000,
          })
        }
      }
      for (let topicHash of topicHashes) {
        try {
          let count = await this.$mixClient.itemTopics.methods.getTopicItemCount(topicHash).call()
          if (count > 0) {
            let itemId = await this.$mixClient.itemTopics.methods.getTopicItem(topicHash, count - 1).call()
            let timestamp = await this.$mixClient.itemStoreIpfsSha256.methods.getRevisionTimestamp(itemId, 0).call()
            subscriptions.push({
              type: 'topic',
              topicHash: topicHash,
              offset: count - 1,
              itemId: itemId,
              timestamp: (timestamp != 0) ? timestamp : 2000000000,
            })
          }
        }
        catch (e) {}
      }

      while (Object.keys(subscriptions).length > 0) {
        // Find the most recent item.
        let topI, topTimestamp = 0
        for (let i in subscriptions) {
          if (subscriptions[i].timestamp > topTimestamp) {
            topI = i
            topTimestamp = subscriptions[i].timestamp
          }
        }
        if (!this.itemIds.includes(subscriptions[topI].itemId)) {
          this.itemIds.push(subscriptions[topI].itemId)
        }
        if (subscriptions[topI].offset == 0) {
          delete subscriptions[topI]
        }
        else {
          let offset = subscriptions[topI].offset - 1
          let itemId
          switch (subscriptions[topI].type) {
            case 'feed':
              itemId = await this.$mixClient.itemDagFeedItems.methods.getChildId(subscriptions[topI].feedId, offset).call()
              break;
            case 'topic':
              itemId = await this.$mixClient.itemTopics.methods.getTopicItem(subscriptions[topI].topicHash, offset).call()
              break;
          }
          let timestamp = await this.$mixClient.itemStoreIpfsSha256.methods.getRevisionTimestamp(itemId, 0).call()
          subscriptions[topI].offset = offset
          subscriptions[topI].itemId = itemId
          subscriptions[topI].timestamp = (timestamp != 0) ? timestamp : 2000000000
        }
      }
    },
  }
</script>
