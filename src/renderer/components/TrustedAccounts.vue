<template>
  <page>
    <template slot="title">
      {{ $t('TrustedAccounts.TrustedAccounts') }}
    </template>

    <template slot="body">
      <b-table :data="trusted" default-sort="account" default-sort-direction="asc">
        <template slot-scope="props">
          <b-table-column :label="$t('TrustedAccounts.Account')" field="account" sortable>
            <router-link :to="props.row.route">{{ props.row.title }}</router-link>
          </b-table-column>
          <b-table-column label="">
            <span class="remove" @click="removeTrusted" :data-address="props.row.account">{{ $t('TrustedAccounts.Remove') }}</span>
          </b-table-column>
        </template>
      </b-table>
      <h2 class="subtitle">{{ $t('TrustedAccounts.Whitelist') }}</h2>
      <b-table :data="whitelist" default-sort="account" default-sort-direction="asc">
        <template slot-scope="props">
          <b-table-column :label="$t('TrustedAccounts.Account')" field="account" sortable>
            <router-link :to="props.row.route">{{ props.row.title }}</router-link>
          </b-table-column>
          <b-table-column label="">
            <span class="remove" @click="removeVisibility" :data-address="props.row.account">{{ $t('TrustedAccounts.Remove') }}</span>
          </b-table-column>
        </template>
      </b-table>
      <h2 class="subtitle">{{ $t('TrustedAccounts.Blacklist') }}</h2>
      <b-table :data="blacklist" default-sort="account" default-sort-direction="asc">
        <template slot-scope="props">
          <b-table-column :label="$t('TrustedAccounts.Account')" field="account" sortable>
            <router-link :to="props.row.route">{{ props.row.title }}</router-link>
          </b-table-column>
          <b-table-column label="">
            <span class="remove" @click="removeVisibility" :data-address="props.row.account">{{ $t('TrustedAccounts.Remove') }}</span>
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
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'trusted-accounts',
    components: {
      Page,
    },
    data() {
      return {
        trusted: [],
        whitelist: [],
        blacklist: [],
      }
    },
    methods: {
      async loadData() {
        let trusted = []
        let whitelist = []
        let blacklist = []
        let trustedAccounts = await this.$activeAccount.get().call(this.$mixClient.trustedAccounts, 'getAllTrusted')
        await trustedAccounts.forEach(async contractAddress => {
          let account = await new MixAccount(this.$root, contractAddress, true).init()
          let profileItemId = await account.call(this.$mixClient.accountProfile, 'getProfile')
          let profileItem = await new MixItem(this.$root, profileItemId).init()
          let profileRevision = await profileItem.latestRevision().load()
          trusted.push({
            account: account.contractAddress,
            title: profileRevision.getTitle(),
            route: '/item/' + profileItemId,
          })
        })

        await this.$db.createReadStream({
          'gte': '/accountVisibility/' + this.$activeAccount.get().contractAddress + '/',
          'lt': '/accountVisibility/' + this.$activeAccount.get().contractAddress + '/z',
        })
        .on('data', async (data) => {
          let accountAddress = data.key.split('/')[3]
          let account = await new MixAccount(this.$root, accountAddress, true).init()
          let profileItemId = await account.call(this.$mixClient.accountProfile, 'getProfile')
          let profileItem = await new MixItem(this.$root, profileItemId).init()
          let profileRevision = await profileItem.latestRevision().load()

          switch (data.value) {
            case 'whitelist':
              whitelist.push({
                account: accountAddress,
                title: profileRevision.getTitle(),
                route: '/item/' + profileItemId,
              })
              break;

            case 'blacklist':
              blacklist.push({
                account: accountAddress,
                title: profileRevision.getTitle(),
                route: '/item/' + profileItemId,
              })
              break;
          }
         })

         this.trusted = trusted
         this.whitelist = whitelist
         this.blacklist = blacklist
      },
      async removeTrusted(event) {
        await this.$activeAccount.get().sendData(this.$mixClient.trustedAccounts, 'untrustAccount', [event.target.dataset.address], 0, 'Untrust account')
        this.loadData()
      },
      async removeVisibility(event) {
        await this.$db.del('/accountVisibility/' + this.$activeAccount.get().contractAddress + '/' + event.target.dataset.address)
        this.loadData()
      },
    },
    created() {
      setTitle(this.$t('TrustedAccounts.TrustedAccounts'))
      this.loadData()
    },
  }
</script>

<style scoped>
  .remove {
    cursor: pointer;
    user-select: none;
  }

  h2 {
    margin-top: 1.5rem;
  }
</style>
