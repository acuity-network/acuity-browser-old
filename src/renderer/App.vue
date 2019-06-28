<template>
  <div>
    <transition name="fade">
      <splash v-if="splash"></splash>
    </transition>
    <div v-if="!splash">
      <div id="sidebar">
        <active-account></active-account>
        <navigation></navigation>
        <p class="menu-label">
         {{ $t('general') }}
        </p>
        <ul class="menu-list">
          <li><router-link to="/home">{{ $t('home') }}</router-link>
          <li><router-link to="/feeds">{{ $t('myFeeds') }}</router-link>
          <li><router-link to="/subscriptions">{{ $t('subscriptions') }}</router-link>
          <li><router-link to="/interactions">{{ $t('interactions') }}</router-link>
          <li><router-link to="/browsing-history">{{ $t('browsingHistory') }}</router-link></li>
          <li><router-link to="/downloads">{{ $t('downloads') }}</router-link></li>
          <li><router-link to="/publish-item">{{ $t('publishItem') }}</router-link></li>
          <li><router-link to="/goto">{{ $t('gotoItem') }}</router-link></li>
        </ul>
        <p class="menu-label">
          {{ $t('account') }}
        </p>
        <ul class="menu-list">
          <li><router-link to="/transaction-history">{{ $t('transactionHistory') }}</router-link></li>
          <li><router-link to="/profile">{{ $t('profile') }}</router-link></li>
          <li><router-link to="/trusted-accounts">{{ $t('trustedAccounts') }}</router-link></li>
          <li><router-link to="/wallet">{{ $t('wallet') }}</router-link></li>
          <li><router-link to="/tokens">{{ $t('tokens') }}</router-link></li>
        </ul>
        <p class="menu-label">
          {{ $t('administration') }}
        </p>
        <ul class="menu-list">
          <li><router-link to="/manage-accounts">{{ $t('accounts') }}</router-link></li>
          <li><router-link to="/node-status">{{ $t('nodeStatus') }}</router-link></li>
          <li><router-link to="/mining">{{ $t('mining') }}</router-link></li>
          <li><router-link to="/settings">{{ $t('settings') }}</router-link></li>
          <li><router-link to="/debug">{{ $t('debugItem') }}</router-link></li>
        </ul>
      </div>
      <div id="router-view" tabindex="0">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script>
  import MixAccount from '../lib/MixAccount.js'
  import MixPinner from '../lib/MixPinner.js'
  import Splash from './components/Splash.vue'
  import Navigation from './components/Navigation.vue'
  import ActiveAccount from './components/ActiveAccount.vue'
  import i18n from './plugins/i18n'
  import { ipcRenderer } from 'electron'

  export default {
    name: 'd-web',
    components: {
      Splash,
      Navigation,
      ActiveAccount,
    },
    data() {
      return {
        splash: true
      }
    },
    async created() {
      ipcRenderer.on('ipfs-stdout', (event, msg) => {
        console.log('IPFS: ' + msg)
      })
      ipcRenderer.on('ipfs-stderr', (event, msg) => {
        console.error('IPFS: ' + msg)
      })
      ipcRenderer.on('parity-stdout', (event, msg) => {
        console.log('Parity: ' + msg)
      })
      ipcRenderer.on('parity-stderr', (event, msg) => {
        console.error('Parity: ' + msg)
      })
      await Promise.all([this.$mixClient.init(this.$root), this.$ipfsClient.init(this.$root)])
      // Start the pinner.
      this.pinner = new MixPinner(this.$root)
      this.pinner.start()
      // Load previous active account.
      try {
        let controller = await this.$db.get('/active-account')
        window.activeAccount = await new MixAccount(this.$root, controller).init()
      }
      catch(e) {}
      window.downloads = []
      await this.$settings.init(this.$db)
      // Load previous selected language.
      i18n.locale = this.$settings.get('locale')
      this.$db.createValueStream({
        'gt': '/account/controllerAddress/',
        'lt': '/account/controllerAddress/z',
      })
      .on('data', async controller => {
        let account = await new MixAccount(this, controller).init()
        if (!account.contract) {
          return
        }
        let startingBlock = await this.$mixClient.web3.eth.getBlockNumber()
        account.contract.events.Receive({
          fromBlock: 0,
          toBlock: 'pending',
        })
        .on('data', log => {
          let payment = {
            transaction: log.transactionHash,
            sender: log.returnValues.from,
            amount: log.returnValues.value.toString(),
          }
          // Only show notifications for TX that occurred since logging in.
          if (log.blockNumber >= startingBlock) {
            let notification = this.$notifications.mixReceived(account.contractAddress, this.$mixClient.web3.utils.fromWei(payment.amount, 'Ether'))
            new Notification(notification.title, notification)
          }
          this.$db.get('/account/contract/' + account.contractAddress + '/receivedIndex/' + log.transactionHash + '/' + log.logIndex)
          .then(id => {
            return this.$db.put('/account/contract/' + account.contractAddress + '/received/' + id, JSON.stringify(payment))
          })
          .catch(error => {
            let id
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
            this.$root.$emit('account-receive', account.contractAddress)
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
            this.$root.$emit('account-receive', account.contractAddress)
          })
        })
      })
      this.splash = false
    },
    destroyed() {
      this.pinner.stop()
    },
  }
</script>

<style lang="scss">
  // Import Bulma's core
  @import "~bulma/sass/utilities/_all";

  // Set your colors
  $body-background-color: $black-bis;
  $table-background-color: $black-bis;
  $background: $black-bis;
  $body-color: $grey-lighter;
  $text: $grey-lighter;
  $title-color: $grey-lighter;
  $subtitle-color: $grey-lighter;
  $table-color: $grey-lighter;
  $table-head-cell-color: $grey-lighter;
  $code-background: $black-bis;
  $code: $grey-lighter;
  $label-color: $grey-lighter;
  $input-background-color: $black-ter;
  $input-border-color: $grey-dark;
  $button-background-color: $grey-lighter;
  $input-color: $grey-lighter;
  $input-disabled-color: $grey-lighter;
  $menu-item-hover-color: $grey;
  $primary: $blue;
  $primary-invert: findColorInvert($primary);

  // Setup $colors to use as bulma classes (e.g. 'is-twitter')
  $colors: (
    "white": ($white, $black),
    "black": ($black, $white),
    "light": ($light, $light-invert),
    "dark": ($dark, $dark-invert),
    "primary": ($primary, $primary-invert),
    "info": ($info, $info-invert),
    "success": ($success, $success-invert),
    "warning": ($warning, $warning-invert),
    "danger": ($danger, $danger-invert),
  );

  // Links
  $link: $primary;
  $link-invert: $primary-invert;
  $link-focus-border: $primary;

  #sidebar .router-link-active {
    color: $link-invert;
    background-color: $link;
  }

  // Import Bulma and Buefy styles
  @import "~bulma";
  @import "~buefy/src/scss/buefy";

  html body, html button, html textarea, html input, html select {
    -webkit-font-smoothing: subpixel-antialiased;
  }

  html body, html button, html input, html select {
    font-family: "Noto Sans";
  }

  html textarea.textarea {
    font-family: "Noto Mono";
    font-size: 0.8rem;
  }

  html button {
    font-weight: bold;
  }

  .menu-label, .menu-list {
    line-height: .85;
  }

  .markdown p {
    -webkit-margin-before: 1em;
    -webkit-margin-after: 1em;
    -webkit-margin-start: 0;
    -webkit-margin-end: 0;
  }

  .markdown blockquote {
    -webkit-margin-before: 1em;
    -webkit-margin-after: 1em;
    -webkit-margin-start: 40px;
    -webkit-margin-end: 40px;
  }

  .markdown hr {
    -webkit-margin-before: 0.5em;
    -webkit-margin-after: 0.5em;
    -webkit-margin-start: auto;
    -webkit-margin-end: auto;
    border-style: solid;
    border-width: 1px;
  }

  .markdown h1 {
    font-size: 2em;
    -webkit-margin-before: 0.67em;
    -webkit-margin-after: 0.67em;
    -webkit-margin-start: 0px;
    -webkit-margin-end: 0px;
    font-weight: bold;
  }

  .markdown h2 {
    font-size: 1.5em;
    -webkit-margin-before: 0.83em;
    -webkit-margin-after: 0.83em;
    -webkit-margin-start: 0px;
    -webkit-margin-end: 0px;
    font-weight: bold;
  }

  .markdown h3 {
    font-size: 1.17em;
    -webkit-margin-before: 1em;
    -webkit-margin-after: 1em;
    -webkit-margin-start: 0px;
    -webkit-margin-end: 0px;
    font-weight: bold;
  }

  .markdown h4 {
    -webkit-margin-before: 1.33em;
    -webkit-margin-after: 1.33em;
    -webkit-margin-start: 0;
    -webkit-margin-end: 0;
    font-weight: bold;
  }

  .markdown h5 {
    font-size: .83em;
    -webkit-margin-before: 1.67em;
    -webkit-margin-after: 1.67em;
    -webkit-margin-start: 0;
    -webkit-margin-end: 0;
    font-weight: bold;
  }

  .markdown h6 {
    font-size: .67em;
    -webkit-margin-before: 2.33em;
    -webkit-margin-after: 2.33em;
    -webkit-margin-start: 0;
    -webkit-margin-end: 0;
    font-weight: bold;
  }

  .markdown ul {
    list-style-type: disc;
    -webkit-margin-before: 1em;
    -webkit-margin-after: 1em;
    -webkit-margin-start: 0px;
    -webkit-margin-end: 0px;
    -webkit-padding-start: 40px;
  }

  .markdown ol {
    list-style-type: decimal;
    -webkit-margin-before: 1em;
    -webkit-margin-after: 1em;
    -webkit-margin-start: 0px;
    -webkit-margin-end: 0px;
    -webkit-padding-start: 40px;
  }

  .markdown dd {
    -webkit-margin-start: 40px;
  }

  .markdown dl {
    -webkit-margin-before: 1em;
    -webkit-margin-after: 1em;
    -webkit-margin-start: 0;
    -webkit-margin-end: 0;
  }
</style>

<style scoped>

  .fade-leave-active {
    transition: opacity 0.5s ease-in;
  }

  .fade-leave-to {
    opacity: 0;
  }

  #sidebar {
    position: fixed;
    overflow-y: auto;
    overscroll-behavior: none;
    width: 220px;
    height: 100vh;
    padding: 1rem;
    background-color: rgb(32,32,32);
  }

  #sidebar::-webkit-scrollbar {
    width: 0 !important
  }

  #router-view {
    margin-left: 220px;
    padding: 2em;
  }

  :focus {
    outline: none;
  }
</style>
