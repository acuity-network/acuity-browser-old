<template>
  <span v-if="address">
    <router-link v-if="route" :to="route">{{ title }}</router-link>
    <span v-else>{{ title }}</span>
  </span>
</template>

<script lang="ts">
  import MixAccount from '../../lib/MixAccount.js'
  import MixItem from '../../lib/MixItem.js'

  export default {
    name: 'profile-link',
    props: ['address'],
    data() {
      return {
        route: '',
        title: '',
      }
    },
    methods: {
      async loadData() {
        if (this.address) {
          try {
            let account = await new MixAccount(this.$root, this.address, true).init()
            let itemId = await account.call(this.$mixClient.accountProfile, 'getProfile')
            let profile = await new MixItem(this.$root, itemId).init()
            let revision = await profile.latestRevision().load()
            this.route = '/item/' + itemId
            this.title = await revision.getTitle()
          }
          catch (e) {
            this.route = null
            this.title = this.address
          }
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
