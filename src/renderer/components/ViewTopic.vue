<template>
  <page>
    <template slot="title">
      {{ $t('ViewTopic.Topic') }}: {{ topic }}
      <button v-if="!isSubscribed" class="button is-primary" @click="subscribe">{{ $t('ViewTopic.Subscribe') }}</button>
      <button v-if="isSubscribed" class="button is-primary" @click="unsubscribe">{{ $t('ViewTopic.Unsubscribe') }}</button>
    </template>

    <template slot="subtitle">
    </template>
    <template slot="body">
      <view-item v-for="itemId in itemIds" :short="true" :itemId="itemId" :key="itemId"></view-item>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import ViewItem from './ViewItem.vue'
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'view-topic',
    props: {
      topicHash: {
        type: String,
        required: true,
      },
    },
    components: {
      Page,
      ViewItem,
    },
    data() {
      return {
        topic: '',
        isSubscribed: false,
        itemIds: [],
      }
    },
    async created() {
      this.loadData()
    },
    methods: {
      async loadData() {
        this.topic = await this.$mixClient.itemTopics.methods.getTopic(this.topicHash).call()
        setTitle(this.topic)

        try {
          await this.$db.get('/accountTopicSubscribed/' + this.$activeAccount.get().contractAddress + '/' + this.topicHash)
          this.isSubscribed = true
        }
        catch (e) {}

        this.itemIds = (await this.$mixClient.itemTopics.methods.getAllTopicItems(this.topicHash).call()).reverse()
      },
      async subscribe(event) {
        await this.$db.put('/accountTopicSubscribed/' + this.$activeAccount.get().contractAddress + '/' + this.topicHash, this.topicHash)
        this.isSubscribed = true
      },
      async unsubscribe(event) {
        await this.$db.del('/accountTopicSubscribed/' + this.$activeAccount.get().contractAddress + '/' + this.topicHash)
        this.isSubscribed = false
      },
    },
    watch: {
      topicHash() {
        this.loadData()
      }
    },
  }
</script>
