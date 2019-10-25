<template>
  <router-link v-if="itemId" :to="route">{{ title }}</router-link>
</template>

<script lang="ts">
  import MixItem from '../../lib/MixItem'

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
          this.route = '/item/' + this.itemId
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
