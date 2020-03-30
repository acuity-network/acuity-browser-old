<template>
  <div>
    <b-field :label="$t('AccountInfo.AccountType')">
      {{ type }}
    </b-field>
    <b-field :label="$t('AccountInfo.Location')">
      {{ location }}
    </b-field>
    <b-field :label="$t('AccountInfo.Feeds')">
      <ul>
        <li v-for="itemId in feeds" :key="itemId">
          <item-link :itemId="itemId"></item-link>
        </li>
      </ul>
    </b-field>
    <b-field :label="$t('AccountInfo.TrustedThatTrust')">
      <ul>
        <li v-for="address in trustedThatTrust" :key="address">
          <profile-link :address="address"></profile-link>
        </li>
      </ul>
    </b-field>
    <b-field :label="$t('AccountInfo.Trusts')">
      <ul>
        <li v-for="address in trusted" :key="address">
          <profile-link :address="address"></profile-link>
        </li>
      </ul>
    </b-field>
    <b-field  v-if="!isOwnProfile" :label="$t('AccountInfo.VisibilityOverride')">
      <b-select v-model="visibility">
        <option value="none">None</option>
        <option value="whitelist">{{ $t('AccountInfo.Whitelist') }}</option>
        <option value="blacklist">{{ $t('AccountInfo.Blacklist') }}</option>
      </b-select>
    </b-field>
    <b-table :data="tokens">
      <template slot-scope="props">
        <b-table-column :label="$t('AccountInfo.Token')">
          <item-link :itemId="props.row.itemId"></item-link>
        </b-table-column>
        <b-table-column :label="$t('AccountInfo.Balance')" numeric>
          {{ props.row.balance }}
        </b-table-column>
      </template>
    </b-table>
    <b-field :label="$t('AccountInfo.Address')">
      {{ address }}
    </b-field>
  </div>
</template>

<script lang="ts">
  import ItemLink from './ItemLink.vue'
  import ProfileLink from './ProfileLink.vue'
  import MixAccount from '../../lib/MixAccount'
  import MixItem from '../../lib/MixItem'

  export default {
    name: 'account-info',
    props: ['address'],
    components: {
      ItemLink,
      ProfileLink,
    },
    data() {
      return {
        isOwnProfile: false,
        type: '',
        location: '',
        feeds: [],
        trusted: [],
        trustedThatTrust: [],
        visibility: 'none',
        tokens: [],
      }
    },
    async created() {
      let account = await new MixAccount(this.$root, this.address, true).init()
      let itemId = await account.getProfile()
      if (await this.$activeAccount.get().getProfile() == itemId) {
        this.isOwnProfile = true
      }
      let item: any = await new MixItem(this, itemId).init()
      let revision = await item.latestRevision().load()
      let profile = revision.getProfile()
      this.location = profile.location

      switch (profile.type) {
        case 0:
          this.type = this.$t('AccountInfo.Anon')
          break

        case 1:
          this.type = this.$t('AccountInfo.Person')
          break

        case 2:
          this.type = this.$t('AccountInfo.Project')
          break

        case 3:
          this.type = this.$t('AccountInfo.Organization')
          break

        case 4:
          this.type = this.$t('AccountInfo.Proxy')
          break

        case 5:
          this.type = this.$t('AccountInfo.Parody')
          break

        case 6:
          this.type = this.$t('AccountInfo.Bot')
          break

        case 7:
          this.type = this.$t('AccountInfo.Shill')
          break

        case 8:
          this.type = this.$t('AccountInfo.Test')
          break
      }

      this.feeds = await this.$activeAccount.get().call(this.$mixClient.accountFeeds, 'getAllItemsByAccount', [this.address])
      this.trusted = await this.$activeAccount.get().call(this.$mixClient.trustedAccounts, 'getAllTrustedByAccount', [this.address])
      this.trustedThatTrust = await this.$activeAccount.get().getTrustedThatTrust(this.address)

      try {
        this.visibility = await this.$db.get('/accountVisibility/' + this.$activeAccount.get().contractAddress + '/' + this.address)
      }
      catch (e) {}

      this.$db.createValueStream({
        'gte': '/accountPortfolio/' + this.$activeAccount.get().contractAddress + '/',
        'lt': '/accountPortfolio/' + this.$activeAccount.get().contractAddress + '/z',
      })
      .on('data', async itemId => {
        try {
          let address = await this.$mixClient.tokenItemRegistry.methods.getToken(itemId).call()
          let token = new this.$mixClient.web3.eth.Contract(require('../../lib/contracts/MixCreatorToken.abi.json'), address)
          let balance = this.$mixClient.formatWei(await token.methods.balanceOf(this.address).call())

          if (balance > 0) {
            this.tokens.push({
              itemId: itemId,
              balance: balance,
            })
          }
        }
        catch (e) {}
      })

    },
    watch: {
      visibility() {
        this.$db.put('/accountVisibility/' + this.$activeAccount.get().contractAddress + '/' + this.address, this.visibility)
      },
    }
  }
</script>
