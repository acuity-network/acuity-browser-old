<template>
  <div class="columns sidebar">
    <div class="column is-narrow">
      <active-account></active-account>
      <navigation></navigation>
      <p class="menu-label">
       {{ $t('general') }}
      </p>
      <ul class="menu-list">
        <li><router-link to="/home">{{ $t('home') }}</router-link>
        <li><router-link to="/feeds">{{ $t('feeds') }}</router-link>
        <li><router-link to="/subscriptions">{{ $t('subscriptions') }}</router-link>
        <li><router-link to="/interactions">{{ $t('interactions') }}</router-link>
        <li><router-link to="/browsing-history">{{ $t('browsingHistory') }}</router-link></li>
        <li><router-link to="/publish-item">{{ $t('publishItem') }}</router-link></li>
        <li><router-link to="/goto">{{ $t('goTo') }}</router-link></li>
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
        <li><router-link to="/settings">{{ $t('settings') }}</router-link></li>
        <li><router-link to="/debug">{{ $t('debug') }}</router-link></li>
      </ul>
    </div>
    <div class="column router-view">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
  import MixAccount from '../lib/MixAccount.js'
  import MixPinner from '../lib/MixPinner.js'
  import Navigation from './components/Navigation.vue'
  import ActiveAccount from './components/ActiveAccount.vue'
  import i18n from './plugins/i18n'

  export default {
    name: 'd-web',
    components: {
      Navigation,
      ActiveAccount,
    },
    created() {
      // Start the pinner.
      this.pinner = new MixPinner(this.$root)
      this.pinner.start()
      // Load previous active account.
      this.$db.get('/active-account')
      .then(controller => {
        new MixAccount(this.$root, controller).init()
        .then(account => {
          window.activeAccount = account
        })
      })
      .catch(() => {})

      //load previous selected language
      this.$db.get('/locale')
      .then(_locale => {
        i18n.locale = _locale;
      })
      .catch(() => {
        //initalize locale as default locale, since DB record doesnt exist.
        this.$db.put('/locale', 'en');
        i18n.locale = 'en';
      })

      this.$db.createValueStream({
        'gt': '/account/controllerAddress/',
        'lt': '/account/controllerAddress/z',
      })
      .on('data', async controller => {
        let account = await new MixAccount(this, controller).init()
        if (!account.contract) {
          return;
        }
        let startingBlock = await this.$web3.eth.getBlockNumber();
        account.contract.events.Receive({
          fromBlock: 0,
          toBlock: 'pending',
        })
        .on('data', log => {
          var payment = {
            transaction: log.transactionHash,
            sender: log.returnValues.from,
            amount: log.returnValues.value,
          }
          //only show notifications for TX that occurred since logging in.
          if(log.blockNumber >= startingBlock) {
            let notification = this.$notifications.mixReceived(account.contractAddress, this.$web3.utils.fromWei(payment.amount, 'Ether'))
            new Notification(notification.title, notification)
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
  .is-narrow {
    position: fixed;
    padding: 1.5rem;
  }

  .router-view {
    margin-left: 240px;
  }
</style>
