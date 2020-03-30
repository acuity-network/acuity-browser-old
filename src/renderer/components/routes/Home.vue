<template>
  <main>
    <view-item v-for="itemId in itemIds" :short="true" :trust="true" :hexItemId="itemId" :key="itemId"></view-item>
  </main>
</template>

<script lang="ts">
  import Page from '../Page.vue'
  import ViewItem from './ViewItem.vue'
  import setTitle from '../../../lib/setTitle'
  import bs58 from 'bs58'

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
      setTitle(this.$t('Home.Home'))
      let feedIds: string[] = []
      let topicHashes: string[] = []

      let feedsPromise = new Promise((resolve, reject) => {
        this.$db.createValueStream({
          'gte': '/accountSubscribed/' + this.$activeAccount.get().contractAddress + '/',
          'lt': '/accountSubscribed/' + this.$activeAccount.get().contractAddress + '/z',
        })
        .on('data', feedId => {
          feedIds.push(feedId)
        })
        .on('end', async () => {
          resolve()
        })
      })

      if (feedIds.length == 0) {
        feedIds = [
          '0x86e5019a26041a2805d500f5aa135795bd907eed0126c41bf1b5847865d2094d',
          '0x' + bs58.decode('CgziFUBnyJrZfDo6jM4XGpbrxPm3J5AxJ').toString('hex') + 'f1b5847865d2094d',
          '0x' + bs58.decode('CiFdy7CEpnQuhgwJY4pwnxD6CL2re527R').toString('hex') + 'f1b5847865d2094d',
          '0x' + bs58.decode('H91JVrbDyivaP5xo5obFbiWXGVRX5uL1').toString('hex') + 'f1b5847865d2094d',
          '0x' + bs58.decode('PojNbuJpgVjrjkC8csBf2HdVSWZFRZMSi').toString('hex') + 'f1b5847865d2094d',
          '0x' + bs58.decode('VkmJBvxyPg5A1KdfXBeuboWt8Tgco67Q').toString('hex') + 'f1b5847865d2094d',
          '0x' + bs58.decode('BtYDECATwEPear16xyQBvxF7zX83GC4J').toString('hex') + 'f1b5847865d2094d',
          '0x' + bs58.decode('F7tdrrFzR4L1fhn3DgtA8Bf2nsVnSkA4W').toString('hex') + 'f1b5847865d2094d',
          '0x' + bs58.decode('64Ly1YSy9NRXm8pw1zYeNcGAwWMDeEXKP').toString('hex') + 'f1b5847865d2094d',
          '0x' + bs58.decode('7tE52QZbGYQ1PtTcvYLdNkM3Fkzh1g24Q').toString('hex') + 'f1b5847865d2094d',
          '0x' + bs58.decode('HuWBRzBuUkfsx7KKrSTFXGwFux5ZwrQzL').toString('hex') + 'f1b5847865d2094d',
          '0x' + bs58.decode('FQ5LyADDgyMrAYGk5pYp987EXY1vH3Jni').toString('hex') + 'f1b5847865d2094d',
          '0x' + bs58.decode('JtiLupdkv8cxERFJRgBhQCmFH4WCUGrce').toString('hex') + 'f1b5847865d2094d',
          '0x' + bs58.decode('7ARkzMTmvgosZ18TR1CcZ3sXHF23RNxwD').toString('hex') + 'f1b5847865d2094d',
          '0x' + bs58.decode('PtfAXEGn7PXFcEQDjFVpm3gKogUe1n97r').toString('hex') + 'f1b5847865d2094d',
          '0x' + bs58.decode('8Fe7PX8JQfg8rAXKet8BT87JWvWNrMGBX').toString('hex') + 'f1b5847865d2094d',
          '0x' + bs58.decode('32qEcLW5zcthiEuYK1ai3gpRwPPc9wfcu').toString('hex') + 'f1b5847865d2094d',
          '0x' + bs58.decode('AfpJmbkbgBi6hE1h33k3ZaLMoio2e6qB2').toString('hex') + 'f1b5847865d2094d',
          '0x' + bs58.decode('95oxHN6btfcvgifVmTiz7U7ssczuu9Bqt').toString('hex') + 'f1b5847865d2094d',
          '0x' + bs58.decode('3HY58gcHv9dEJk4cEQTm3obQUeZPnzMsT').toString('hex') + 'f1b5847865d2094d',
        ]
      }

      let topicsPromise = new Promise((resolve, reject) => {
        this.$db.createValueStream({
          'gte': '/accountTopicSubscribed/' + this.$activeAccount.get().contractAddress + '/',
          'lt': '/accountTopicSubscribed/' + this.$activeAccount.get().contractAddress + '/z',
        })
        .on('data', topicHash => {
          topicHashes.push(topicHash)
        })
        .on('end', async () => {
          resolve()
        })
      })

      await Promise.all([feedsPromise, topicsPromise])

      let subscriptions: any[] = []
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
          let timestamp
          try {
            timestamp = await this.$mixClient.itemStoreIpfsSha256.methods.getRevisionTimestamp(itemId, 0).call()
          } catch (e) {}
          subscriptions[topI].offset = offset
          subscriptions[topI].itemId = itemId
          subscriptions[topI].timestamp = (timestamp != 0) ? timestamp : 2000000000
        }
      }
    },
  }
</script>
