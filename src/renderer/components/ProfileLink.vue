<template>
  <span v-if="title">
    <router-link :to="route">{{ title }}</router-link>
  </span>
</template>

<script lang="ts">
  import MixAccount from '../../lib/MixAccount'
  import MixItem from '../../lib/MixItem'
  import bs58 from 'bs58'

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
            this.route = '/item/' + bs58.encode(Buffer.from(this.$mixClient.web3.utils.hexToBytes(itemId.substr(0, 50))))
            this.title = revision.getTitle()
          }
          catch (e) {
            this.route = '/profile/edit'
            this.title = 'Unnamed'
          }
        }
      },
    },
    created() {
      this.loadData()
    },
    watch: {
      address(val, oldVal) {
        this.title = ''
        this.loadData()
      },
    }
  }

</script>
