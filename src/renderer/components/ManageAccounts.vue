<template>
  <page>
    <template slot="title">
      Manage accounts
    </template>

    <template slot="body">
      <b-table :data="data" :selected.sync="selected" v-on:click="select" default-sort="account">
        <template slot-scope="props">

          <b-table-column field="account" label="Account" sortable>
            <span class="clickable">{{ props.row.name }}</span>
          </b-table-column>

          <b-table-column field="balance" label="Balance">
            {{ props.row.balance }}
          </b-table-column>

        </template>
        <template slot="footer">
          <router-link class="footer-link" :to="{ name: 'manage-accounts-new' }">Create account</router-link>
          <router-link class="footer-link" :to="{ name: 'recover-account' }">Recover account</router-link>
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
          let itemId = await account.call(this.$accountProfile.methods.getProfile())
          let item = await new MixItem(this, itemId).init()
          let revision = await item.latestRevision().load()

          var row = {
            account: address,
            name: revision.getTitle(),
            balance: this.$web3.utils.fromWei(await account.getUnconfirmedBalance()),
          }
          this.data.push(row)
          if (window.activeAccount && address == window.activeAccount.controllerAddress) {
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
