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
      <h2 class="subtitle">{{ $t('TrustedAccounts.Trusters') }}</h2>
      <ul>
        <li v-for="address in trusters" :key="address">
          <profile-link :address="address"></profile-link>
        </li>
      </ul>
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

<script lang="ts">
  import Page from './Page.vue'
  import MixAccount from '../../lib/MixAccount'
  import MixItem from '../../lib/MixItem'
  import setTitle from '../../lib/setTitle'
  import bs58 from 'bs58'
  import ProfileLink from './ProfileLink.vue'

  export default {
    name: 'trusted-accounts',
    components: {
      Page,
      ProfileLink,
    },
    data() {
      return {
        trusted: [],
        trusters: [],
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
            route: '/item/' + bs58.encode(Buffer.from(this.$mixClient.web3.utils.hexToBytes(profileItemId.substr(0, 50)))),
          })
        })

        let events = await this.$mixClient.trustedAccounts.getPastEvents('allEvents', {
          fromBlock: 0,
          toBlock: 'pending',
          topics: [,, ['0x000000000000000000000000' + this.$activeAccount.get().contractAddress.substr(2)]],
        })

        for (let event of events) {
          switch (event.event) {
            case 'TrustAccount':
              this.trusters.push(event.returnValues.account)
              break;
            case 'UntrustAccount':
              let i = this.trusters.indexOf(event.returnValues.account);
              if (i > -1) {
                this.trusters.splice(i, 1);
              }
              break;
          }
        }

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
                route: '/item/' + bs58.encode(Buffer.from(this.$mixClient.web3.utils.hexToBytes(profileItemId.substr(0, 50)))),
              })
              break;

            case 'blacklist':
              blacklist.push({
                account: accountAddress,
                title: profileRevision.getTitle(),
                route: '/item/' + bs58.encode(Buffer.from(this.$mixClient.web3.utils.hexToBytes(profileItemId.substr(0, 50)))),
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
