<template>
  <router-link :to="route">{{ title }}</router-link>
</template>

<script>
  import MixItem from '../../lib/MixItem.js'

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
        let item = await new MixItem(this.$root, this.itemId).init()
        let revision = await item.latestRevision().load()
        this.route = '/item/' + this.itemId
        this.title = await revision.getTitle()
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
