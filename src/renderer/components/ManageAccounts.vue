<template>
  <page>
    <template slot="title">
      {{ $t('accounts') }}
    </template>

    <template slot="body">
      <b-table :data="data" :selected.sync="selected" @click="select" default-sort="account">
        <template slot-scope="props">

          <b-table-column field="account" :label="$t('account')" sortable>
            <span class="clickable">{{ props.row.name }}</span>
          </b-table-column>

          <b-table-column field="balance" :label="$t('balance')">
            {{ props.row.balance }}
          </b-table-column>

          <b-table-column field="operations">
            <router-link v-if="props.row.deploy" :to="props.row.deploy">deploy</router-link>
          </b-table-column>

        </template>
        <template slot="footer">
          <router-link class="footer-link" :to="{ name: 'manage-accounts-new' }">{{ $t('createAccount') }}</router-link>
          <router-link class="footer-link" :to="{ name: 'manage-accounts-recover' }">{{ $t('recoverAccount') }}</router-link>
        </template>
      </b-table>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import MixAccount from '../../lib/MixAccount.js'
  import MixItem from '../../lib/MixItem.js'
  import ManageAccountsNew from './ManageAccountsNew.vue'
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'manage-accounts',
    components: {
      Page,
      ManageAccountsNew,
    },
    data() {
      return {
        data: [],
        selected: {}
      }
    },
    methods: {
      loadAccounts() {
        this.$db.createValueStream({
          'gt': '/account/controllerAddress/',
          'lt': '/account/controllerAddress/z',
        })
        .on('data', async address => {
          let account = await new MixAccount(this.$root, address).init()
          let name = 'Unnamed'
          try {
            let itemId = await account.call(this.$mixClient.accountProfile, 'getProfile')
            let item = await new MixItem(this, itemId).init()
            let revision = await item.latestRevision().load()
            name = revision.getTitle()
          }
          catch (e) {}

          let row = {
            account: address,
            name: name,
            balance: this.$mixClient.web3.utils.fromWei(await account.getBalance()),
            deploy: account.contractAddress ? '' : '/manage-accounts/controller/' + address
          }
          this.data.push(row)
          if (this.$activeAccount.get() && address == this.$activeAccount.get().controllerAddress) {
            this.selected = row
          }
        })
      },
      async select(event) {
        let account = await new MixAccount(this.$root, event.account).init()
        account.select()
      },
    },
    created() {
      setTitle(this.$t('accounts'))
      this.loadAccounts()
    },
  }
</script>

<style scoped>
  .clickable {
    cursor: pointer;
    user-select: none;
  }

  .footer-link {
    padding-right: 20px;
  }
</style>
