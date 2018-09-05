<template>
  <div class="columns sidebar">
    <div class="column is-narrow">
      <section class="section menu">
        <p class="menu-label">
          General
        </p>
        <ul class="menu-list">
          <li><router-link to="/feeds">Feeds</router-link>
          <li><router-link to="/interactions">Interactions</router-link>
          <li><router-link to="/browsing-history">Browsing History</router-link></li>
          <li><router-link to="/publish-item">Publish Item</router-link></li>
          <li><router-link to="/search">Search</router-link></li>
        </ul>
        <p class="menu-label">
          Account
        </p>
        <ul class="menu-list">
          <li><router-link to="/transaction-history">Transaction History</router-link></li>
          <li><router-link to="/profile">Profile</router-link></li>
          <li><router-link to="/trusted-accounts">Trusted Accounts</router-link></li>
          <li><router-link to="/wallet">Wallet</router-link></li>
          <li><router-link to="/video">Video</router-link></li>
        </ul>
        <p class="menu-label">
          Administration
        </p>
        <ul class="menu-list">
          <li><router-link to="/manage-accounts">Accounts</router-link></li>
          <li><router-link to="/node-status">Node Status</router-link></li>
          <li><router-link to="/settings">Settings</router-link></li>
          <li><router-link to="/debug">Debug</router-link></li>
          <li><router-link to="/block-explorer">Block Explorer</router-link></li>
        </ul>
      </section>
    </div>
    <div class="column router-view">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
  import MixAccount from '../lib/MixAccount.js'
  import { bus } from './main'

  export default {
    name: 'd-web',
    created() {
      // Load previous active account.
      this.$db.get('/active-account')
      .then(controller => {
        new MixAccount(this.$root, controller).init()
        .then(account => {
          window.activeAccount = account
        })
      })
      .catch(() => {})
      this.$web3.eth.personal.getAccounts()
      .then(controllers => {
        var promises = []
        controllers.forEach(controller => {
          var account = new MixAccount(this, controller)
          account.init()
          .then(() => {
            return account.contract.events.Receive({
              fromBlock: 0,
              toBlock: 'pending',
            })
            .on('data', log => {
              var payment = {
                transaction: log.transactionHash,
                sender: log.returnValues.from,
                amount: log.returnValues.value,
              }

              this.$db.get('/account/contract/' + account.contractAddress + '/receivedIndex/' + log.transactionHash + '/' + log.logIndex)
              .then(id => {
                return this.$db.put('/account/contract/' + account.contractAddress + '/received/' + id, JSON.stringify(payment))
              })
              .catch(error => {
                var id
                return this.$db.get('/account/contract/' + account.contractAddress + '/receivedCount')
                .then(count => {
                  id = parseInt(count)
                })
                .catch(err => {
                  id = 0
                })
                .then(() => {
                  return this.$db.batch()
                  .put('/account/contract/' + account.contractAddress + '/received/' + id, JSON.stringify(payment))
                  .put('/account/contract/' + account.contractAddress + '/receivedIndex/' + log.transactionHash + '/' + log.logIndex, id)
                  .put('/account/contract/' + account.contractAddress + '/receivedCount', id + 1)
                  .write()
                })
              })
              .then(() => {
                bus.$emit('account-receive', account.contractAddress)
                account.isUnlocked()
                .then(unlocked => {
                  if (unlocked) {
                    account.consolidateMix()
                  }
                })
              })
            })
            .on('changed', log => {
              this.$db.get('/account/contract/' + account.contractAddress + '/receivedIndex/' + log.transactionHash + '/' + log.logIndex)
              .then(id => {
                return this.$db.batch()
                .del('/account/contract/' + account.contractAddress + '/receivedIndex/' + log.transactionHash + '/' + log.logIndex)
                .del('/account/contract/' + account.contractAddress + '/received/' + id)
                .write()
              })
              .then(() => {
                bus.$emit('account-receive', account.contractAddress)
              })
            })
          })
          .catch(() => {})
        })
      })
    },
  }
</script>

<style>
  .is-narrow {
    position: fixed;
  }

  .router-view {
    margin-left: 240px;
  }
</style>
