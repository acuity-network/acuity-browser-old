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

              <b-table-column field="action" label="Action">
                <router-link :to="{ name: props.row.route, params: { address: props.row.account }}">{{ props.row.action }}</router-link>
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

  export default {
    name: 'manage-accounts',
    components: {},
    data() {
      return {
        data: [],
        selected: {}
      }
    },
    methods: {
      select (event) {
        this.$web3.eth.defaultAccount = event.account
      }
    },
    beforeRouteEnter (to, from, next) {
      next(vm => {
        return vm.$web3.eth.personal.getAccounts()
        .then (accounts => {
          for (let address of accounts) {
            Promise.all([
              vm.$web3.eth.getBalance(address),
              vm.$web3.eth.sign('', address)
              .then(() => {
                return true
              })
              .catch(() => {
                return false
              }),
              vm.$db.get('/account/' + address + '/contract')
              .catch(() => {
                return false
              }),
            ])
            .then (result => {
              var row = {
                account: address,
                balance: vm.$web3.utils.fromWei(result[0]),
                action: (result[1] == false) ? 'unlock' : ((result[2] == false) ? 'deploy' : 'lock'),
                route: (result[1] == false) ? 'manage-account-unlock' : 'manage-account-controller',
              }
              vm.data.push(row)
              if (address == vm.$web3.eth.defaultAccount) {
                vm.selected = row
              }
            })
          }
        })
      })
    },
  }
</script>
