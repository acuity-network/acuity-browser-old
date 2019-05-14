<template>
  <div>
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
  import ProfileLink from './ProfileLink.vue'

  export default {
    name: 'account-trusts',
    props: ['address'],
    components: {
      ProfileLink,
    },
    data() {
      return {
        trusted: [],
        trustedThatTrust: [],
      }
    },
    async created() {
      this.trusted = await window.activeAccount.call(this.$trustedAccounts.methods.getAllTrustedByAccount(this.address))
      this.trustedThatTrust = await window.activeAccount.getTrustedThatTrust(this.address)
    },
  }
</script>
