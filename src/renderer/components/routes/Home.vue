<template>
  <main>
    <view-item v-for="itemId in itemIds" :short="true" :trust="true" :hexItemId="itemId" :key="itemId"></view-item>
  </main>
</template>

<script lang="ts">
  import Vue from 'vue'
  import Page from '../Page.vue'
  import ViewItem from './ViewItem.vue'
  import setTitle from '../../../lib/setTitle'
  import bs58 from 'bs58'

  export default Vue.extend({
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
      setTitle(this.$t('Home.Home'))
      let feedIds: string[] = []

      await new Promise((resolve, reject) => {
        this.$db.createValueStream({
          'gte': '/accountSubscribed/' + this.$activeAccount.get().contractAddress + '/',
          'lt': '/accountSubscribed/' + this.$activeAccount.get().contractAddress + '/z',
        })
        .on('data', (feedId: string) => {
          feedIds.push(feedId)
        })
        .on('end', async () => {
          resolve()
        })
      })

      if (feedIds.length == 0) {
        feedIds = [
          '0x86e5019a26041a2805d500f5aa135795bd907eed0126c41bf1b5847865d2094d',
        ]
      }

      let subscriptionsPromises: Promise<any>[] = []

      for (let feedId of feedIds) {
        subscriptionsPromises.push(new Promise(async (resolve, reject) => {
          let count = await this.$mixClient.itemDagFeedItems.methods.getChildCount(feedId).call()
          if (count > 0) {
            let itemId = await this.$mixClient.itemDagFeedItems.methods.getChildId(feedId, count - 1).call()
            try {
              let timestamp = await this.$mixClient.itemStoreIpfsSha256.methods.getRevisionTimestamp(itemId, 0).call()
              resolve({
                feedId: feedId,
                offset: count - 1,
                itemId: itemId,
                timestamp: (timestamp != 0) ? timestamp : 2000000000,
              })
            } catch (e) {
              reject()
            }
          }
          else {
            reject()
          }
        }))
      }

      let subscriptionsSettled: any[] = await Promise.allSettled(subscriptionsPromises)
      let subscriptions: any[] = []

      for (let subscriptionSettled of subscriptionsSettled) {
        if (subscriptionSettled.status == 'fulfilled') {
          subscriptions.push(subscriptionSettled.value)
        }
      }

      while (Object.keys(subscriptions).length > 0) {
        // Find the most recent item.
        let topI: number = 0, topTimestamp: number = 0
        for (let i in subscriptions) {
          if (subscriptions[i].timestamp > topTimestamp) {
            topI = parseInt(i)
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
          let itemId = await this.$mixClient.itemDagFeedItems.methods.getChildId(subscriptions[topI].feedId, offset).call()
          let timestamp = 0
          try {
            timestamp = await this.$mixClient.itemStoreIpfsSha256.methods.getRevisionTimestamp(itemId, 0).call()
          }
          catch (e) {}
          subscriptions[topI].offset = offset
          subscriptions[topI].itemId = itemId
          subscriptions[topI].timestamp = (timestamp != 0) ? timestamp : 2000000000
        }
      }
    },
  })
</script>
