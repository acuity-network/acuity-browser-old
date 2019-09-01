<template>
  <page>
    <template slot="title">
      Topic: {{ topic }}
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
        itemIds: [],
      }
    },
    async created() {
      this.topic = await this.$mixClient.itemTopics.methods.getTopic(this.topicHash).call()
      this.itemIds = (await this.$mixClient.itemTopics.methods.getAllTopicItems(this.topicHash).call()).reverse()
    },
  }
</script>
