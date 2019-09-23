<template>
  <div>
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
    <b-field :label="$t('AccountInfo.VisibilityOverride')">
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
        tokens: [],
      }
    },
    async created() {
      this.feeds = await this.$activeAccount.get().call(this.$mixClient.accountFeeds, 'getAllItemsByAccount', [this.address])
      this.trusted = await this.$activeAccount.get().call(this.$mixClient.trustedAccounts, 'getAllTrustedByAccount', [this.address])
      this.trustedThatTrust = await this.$activeAccount.get().getTrustedThatTrust(this.address)

      try {
        this.visibility = await this.$db.get('/accountVisibility/' + this.$activeAccount.get().contractAddress + '/' + this.address)
      }
      catch (e) {}

      let tokens = await this.$activeAccount.get().call(this.$mixClient.accountTokens, 'getAllItemsByAccount', [this.address])
      for (let itemId of tokens) {
        try {
          let address = await this.$mixClient.tokenRegistry.methods.getToken(itemId).call()
          let token = new this.$mixClient.web3.eth.Contract(require('../../lib/contracts/MixCreatorToken.abi.json'), address)
          let toBN = this.$mixClient.web3.utils.toBN
          let balance = this.$mixClient.web3.utils.fromWei(toBN(await token.methods.balanceOf(this.address).call()))

          if (balance > 0) {
            this.tokens.push({
              itemId: itemId,
              balance: balance,
            })
          }
        }
        catch (e) {}
      }
    },
    watch: {
      visibility() {
        this.$db.put('/accountVisibility/' + this.$activeAccount.get().contractAddress + '/' + this.address, this.visibility)
      },
    }
  }
</script>
