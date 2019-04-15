<template>
  <page>
    <template slot="title">
      Trusted Accounts
    </template>

    <template slot="body">
      <b-table :data="data">
        <template slot-scope="props">
          <b-table-column label="Account">
            <router-link :to="props.row.route">{{ props.row.title }}</router-link>
          </b-table-column>
          <b-table-column label="">
            <span class="remove" v-on:click="remove" :data-address="props.row.account">remove</span>
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
      loadData() {
        this.data = []
        window.activeAccount.call(this.$trustedAccounts.methods.getAllTrusted())
        .then(trusted => {
          for (var account of trusted) {
            new MixAccount(this.$root, account, true).init()
            .then(account => {
              account.call(this.$accountProfile.methods.getProfile())
              .then(profileItemId => {
                var route = '/item/' + profileItemId
                new MixItem(this.$root, profileItemId).init()
                .then(profileItem => {
                  return profileItem.latestRevision().load()
                })
                .then(profileRevision => {
                  this.data.push({
                    account: account.contractAddress,
                    title: profileRevision.getTitle(),
                    route: route,
                  })
                })
              })
            })
          }
        })
      },
      remove(event) {
        window.activeAccount.sendData(this.$trustedAccounts.methods.untrustAccount(event.target.dataset.address), 0, 'Untrust account')
        .then(() => {
          this.loadData()
        })
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
