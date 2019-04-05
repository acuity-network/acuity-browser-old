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

          <b-table-column field="lock" label="">
            <span class="clickable" v-if="props.row.unlocked" v-on:click="lock" :data-address="props.row.account">lock</span>
            <span class="clickable" v-else v-on:click="unlock" :data-address="props.row.account">unlock</span>
          </b-table-column>

          <b-table-column field="manage" label=" ">
            <router-link :to="{ name: 'manage-account-controller', params: { address: props.row.account }}">manage</router-link>
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
  import ManageAccountUnlock from './ManageAccountUnlock.vue'
  import ManageAccountsNew from './ManageAccountsNew.vue'

  export default {
    name: 'manage-accounts',
    components: {
      Page,
      ManageAccountUnlock,
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
          let result = await Promise.all([
            this.$web3.eth.getBalance(address),
            true,
            new MixAccount(this.$root, address).init()
            .then(account => {
              return account.call(this.$accountProfile.methods.getProfile())
            })
            .then(itemId => {
              return new MixItem(this, itemId).init()
            })
            .then(item => {
              return item.latestRevision().load()
            })
            .then(revision => {
              return revision.getTitle()
            })
            .catch(() => {
              return false
            }),
          ])
          var row = {
            account: address,
            name: result[2] ? result[2] : address,
            balance: this.$web3.utils.fromWei(result[0]),
            unlocked: result[1],
            action: (result[1] == false) ? 'unlock' : ((result[2] == false) ? 'deploy' : 'lock'),
            route: (result[1] == false) ? 'manage-account-unlock' : 'manage-account-controller',
          }
          this.data.push(row)
          if (window.activeAccount && address == window.activeAccount.controllerAddress) {
            this.selected = row
          }
        })
      },
      async select(event) {
        let account = await new MixAccount(this.$root, event.account).init()
        window.activeAccount = account
        this.$db.put('/active-account', event.account)
        this.$root.$emit('change-active-account', event.account)
      },
      unlock(event) {
        this.$modal.open({
          parent: this,
          component: ManageAccountUnlock,
          hasModalCard: true,
          props: {
            address: event.target.dataset.address,
          },
        })
      },
      lock(event) {
        this.$web3.eth.personal.lockAccount(event.target.dataset.address)
        .then(result => {
          this.loadAccounts();
        })
        .catch(error => {
          console.log(error)
        })
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
