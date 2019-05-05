<template>
  <router-link :to="route">{{ title }}</router-link>
</template>

<script>
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
    watch: {
      address: async function (val, oldVal) {
        let account = await new MixAccount(this.$root, val, true).init()
        let itemId = await account.call(this.$accountProfile.methods.getProfile())
        let profile = await new MixItem(this.$root, itemId).init()
        let revision = await profile.latestRevision().load()
        this.route = '/item/' + itemId
        this.title = await revision.getTitle()
      }
    }
  }

</script>
