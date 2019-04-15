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
    async created() {
      var account = await new MixAccount(this.$root, this.address, true).init()
      var itemId = await account.call(this.$accountProfile.methods.getProfile())
      var profile = await new MixItem(this.$root, itemId).init()
      var revision = await profile.latestRevision().load()
      this.route = '/item/' + itemId
      this.title = await revision.getTitle()
    },
  }

</script>
