<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">Manage accounts</h1>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <b-table :data="data" :selected.sync="selected" v-on:click="select">
            <template slot-scope="props">

              <b-table-column field="account" label="Account">
                {{ props.row.account }}
              </b-table-column>

              <b-table-column field="balance" label="Balance">
                {{ props.row.balance }}
              </b-table-column>

              <b-table-column field="lock" label="">
                <a v-if="props.row.unlocked" v-on:click="lock" :data-address="props.row.account">lock</a>
                <a v-else v-on:click="unlock" :data-address="props.row.account">unlock</a>
              </b-table-column>

              <b-table-column field="manage" label=" ">
                <router-link :to="{ name: 'manage-account-controller', params: { address: props.row.account }}">manage</router-link>
              </b-table-column>

            </template>
            <template slot="footer">
              <router-link to="/manage-accounts/new">Create account</router-link>
            </template>
          </b-table>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
  import ManageAccountUnlock from './ManageAccountUnlock.vue'

  export default {
    name: 'manage-accounts',
    components: {
      ManageAccountUnlock,
    },
    data() {
      return {
        data: [],
        selected: {}
      }
    },
    methods: {
      loadAccounts() {
        this.$web3.eth.personal.getAccounts()
        .then (accounts => {
          this.data = []
          for (let address of accounts) {
            Promise.all([
              this.$web3.eth.getBalance(address),
              this.$web3.eth.sign('', address)
              .then(() => {
                return true
              })
              .catch(() => {
                return false
              }),
              this.$db.get('/account/' + address + '/contract')
              .catch(() => {
                return false
              }),
            ])
            .then (result => {
              var row = {
                account: address,
                balance: this.$web3.utils.fromWei(result[0]),
                unlocked: result[1],
                action: (result[1] == false) ? 'unlock' : ((result[2] == false) ? 'deploy' : 'lock'),
                route: (result[1] == false) ? 'manage-account-unlock' : 'manage-account-controller',
              }
              this.data.push(row)
              if (address == this.$web3.eth.defaultAccount) {
                this.selected = row
              }
            })
          }
        })
      },
      select (event) {
        this.$web3.eth.defaultAccount = event.account
      },
      unlock (event) {
        this.$modal.open({
          parent: this,
          component: ManageAccountUnlock,
          hasModalCard: true,
          props: {
            address: event.target.dataset.address,
          },
        })
      },
      lock (event) {
        this.$web3.eth.personal.lockAccount(event.target.dataset.address)
        .then(result => {
          this.loadAccounts();
        })
        .catch(error => {
          console.log(error)
        })
      },
    },
    created () {
      this.loadAccounts()
    },
  }
</script>
