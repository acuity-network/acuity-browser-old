<template>
  <router-link v-if="itemId" :to="route">{{ title }}</router-link>
</template>

<script lang="ts">
  import MixItem from '../../lib/MixItem'
  import bs58 from 'bs58'

  export default {
    name: 'item-link',
    props: ['itemId'],
    data() {
      return {
        route: '',
        title: '',
      }
    },
    methods: {
      async loadData() {
        if (this.itemId) {
          let item = await new MixItem(this.$root, this.itemId).init()
          let revision = await item.latestRevision().load()
          this.route = '/item/' + bs58.encode(Buffer.from(this.$mixClient.web3.utils.hexToBytes(this.itemId.substr(0, 50))))
          this.title = await revision.getTitle()
        }
      },
    },
    created() {
      this.loadData()
    },
    watch: {
      address(val, oldVal) {
        this.loadData()
      },
    }
  }

</script>
