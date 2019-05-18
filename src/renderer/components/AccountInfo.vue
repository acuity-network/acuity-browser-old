<template>
  <div>
    <b-field label="Feeds">
      <ul>
        <li v-for="itemId in feeds" :key="itemId">
          <item-link :itemId="itemId"></item-link>
        </li>
      </ul>
    </b-field>
    <b-field label="Trusted that trust">
      <ul>
        <li v-for="address in trustedThatTrust" :key="address">
          <profile-link :address="address"></profile-link>
        </li>
      </ul>
    </b-field>
    <b-field label="Trusts">
      <ul>
        <li v-for="address in trusted" :key="address">
          <profile-link :address="address"></profile-link>
        </li>
      </ul>
    </b-field>
  </div>
</template>

<script>
  import ItemLink from './ItemLink.vue'
  import ProfileLink from './ProfileLink.vue'

  export default {
    name: 'account-info',
    props: ['address'],
    components: {
      ItemLink,
      ProfileLink,
    },
    data() {
      return {
        feeds: [],
        trusted: [],
        trustedThatTrust: [],
      }
    },
    async created() {
      this.feeds = await window.activeAccount.call(this.$accountFeeds.methods.getAllItemsByAccount(this.address))
      this.trusted = await window.activeAccount.call(this.$trustedAccounts.methods.getAllTrustedByAccount(this.address))
      this.trustedThatTrust = await window.activeAccount.getTrustedThatTrust(this.address)
    },
  }
</script>
