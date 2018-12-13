<template>
  <page>
    <template slot="title">
      Home
    </template>

    <template slot="body">
      <view-item v-for="itemId in itemIds" v-bind:itemId="itemId"></view-item>
    </template>

  </page>
</template>

<script>
  import Page from './Page.vue'
  import ViewItem from './ViewItem.vue'

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
      let feedIds = []
      this.$db.createValueStream({
        'gte': '/accountSubscribed/' + window.activeAccount.contractAddress + '/',
        'lt': '/accountSubscribed/' + window.activeAccount.contractAddress + '/z',
      })
      .on('data', feedId => {
        feedIds.push(feedId)
      })
      .on('end', async () => {
        let feeds = {}
        for (let feedId of feedIds) {
          let count = await this.$itemDagFeedItems.methods.getChildCount(feedId).call()
          if (count > 0) {
            let itemId = await this.$itemDagFeedItems.methods.getChildId(feedId, count - 1).call()
            feeds[feedId] = {
              offset: count - 1,
              itemId: itemId,
              timestamp: await this.$itemStoreIpfsSha256.methods.getRevisionTimestamp(itemId, 0).call(),
            }
          }
        }
        while (Object.keys(feeds).length > 0) {
          // Find the most recent item.
          let topFeedId, topTimestamp = 0
          for (let feedId in feeds) {
            if (feeds[feedId].timestamp > topTimestamp) {
              topFeedId = feedId
              topTimestamp = feeds[feedId].timestamp
            }
          }
          this.itemIds.push(feeds[topFeedId].itemId)
          if (feeds[topFeedId].offset == 0) {
            delete feeds[topFeedId]
          }
          else {
            let offset = feeds[topFeedId].offset - 1
            let itemId = await this.$itemDagFeedItems.methods.getChildId(topFeedId, offset).call()
            feeds[topFeedId] = {
              offset: offset,
              itemId: itemId,
              timestamp: await this.$itemStoreIpfsSha256.methods.getRevisionTimestamp(itemId, 0).call()
            }
          }
        }
      })
    },
  }
</script>
