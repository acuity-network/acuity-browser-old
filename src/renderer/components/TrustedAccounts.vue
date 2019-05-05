<template>
  <page>
    <template slot="title">
      {{ $t('trustedAccounts') }}
    </template>

    <template slot="body">
      <b-table :data="data">
        <template slot-scope="props">
          <b-table-column :label="$t('account')">
            <router-link :to="props.row.route">{{ props.row.title }}</router-link>
          </b-table-column>
          <b-table-column label="">
            <span class="remove" @click="remove" :data-address="props.row.account">remove</span>
          </b-table-column>
        </template>
      </b-table>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'

  import MixAccount from '../../lib/MixAccount.js'
  import MixItem from '../../lib/MixItem.js'

  export default {
    name: 'trusted-accounts',
    components: {
      Page,
    },
    data() {
      return {
        data: [],
      }
    },
    methods: {
      async loadData() {
        this.data = []
        let trusted = await window.activeAccount.call(this.$trustedAccounts.methods.getAllTrusted())
        trusted.forEach(async contractAddress => {
          let account = await new MixAccount(this.$root, contractAddress, true).init()
          let profileItemId = await account.call(this.$accountProfile.methods.getProfile())
          let profileItem = await new MixItem(this.$root, profileItemId).init()
          let profileRevision = await profileItem.latestRevision().load()
          this.data.push({
            account: account.contractAddress,
            title: profileRevision.getTitle(),
            route: '/item/' + profileItemId,
          })
        })
      },
      async remove(event) {
        await window.activeAccount.sendData(this.$trustedAccounts.methods.untrustAccount(event.target.dataset.address), 0, 'Untrust account')
        this.loadData()
      },
    },
    created() {
      this.loadData()
    },
  }
</script>

<style scoped>
  .remove {
    cursor: pointer;
    user-select: none;
  }
</style>
