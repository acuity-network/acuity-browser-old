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
    <b-field label="Visibilty override">
      <b-select v-model="visibility">
        <option value="none">None</option>
        <option value="whitelist">Whitelist</option>
        <option value="blacklist">Blacklist</option>
      </b-select>
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
        visibility: 'none',
      }
    },
    async created() {
      this.feeds = await window.activeAccount.call(this.$mixClient.accountFeeds, 'getAllItemsByAccount', [this.address])
      this.trusted = await window.activeAccount.call(this.$mixClient.trustedAccounts, 'getAllTrustedByAccount', [this.address])
      this.trustedThatTrust = await window.activeAccount.getTrustedThatTrust(this.address)

      try {
        this.visibility = await this.$db.get('/accountVisibility/' + window.activeAccount.contractAddress + '/' + this.address)
      }
      catch (e) {}
    },
    watch: {
      visibility() {
        this.$db.put('/accountVisibility/' + window.activeAccount.contractAddress + '/' + this.address, this.visibility)
      },
    }
  }
</script>
