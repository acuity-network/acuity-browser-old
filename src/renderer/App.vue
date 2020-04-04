<template>
  <div>
    <transition name="fade">
      <splash v-if="splash"></splash>
    </transition>
    <div v-if="!splash">
      <nav-bar></nav-bar>
      <div id="router-view" tabindex="0">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import MixAccount from '../lib/MixAccount'
  import Splash from './components/Splash.vue'
  import NavBar from './components/NavBar.vue'
  import mentionNotifications from '../lib/mentionNotifications'
  import transcoder from '../lib/transcoder'

  export default Vue.extend({
    name: 'app',
    components: {
      Splash,
      NavBar,
    },
    data() {
      return {
        splash: true,
        isDevelopment: false,
        isDesktop: this.$isDesktop,
      }
    },
    async created() {
      this.$root.$on('development', (isDevelopment: boolean) => {
				this.isDevelopment = isDevelopment
      })
      await this.$settings.init(this.$db)
      await Promise.all([this.$mixClient.init(this.$root, this.$settings.get('mixEndpoint')), this.$ipfsClient.init(this.$root)])
      // Load previous active account.
      try {
        let controller = await this.$db.get('/active-account')
        this.$activeAccount.set(await new MixAccount(this.$root, controller).init())
      }
      catch (e) {
        this.$activeAccount.set(await new MixAccount(this.$root, ''))
      }
      this.splash = false
      // Load previous selected language.
      this.$root.$i18n.locale = this.$settings.get('locale')
      this.isDevelopment = this.$settings.get('development')
      this.$db.createValueStream({
        'gt': '/account/controllerAddress/',
        'lt': '/account/controllerAddress/z',
      })
      .on('data', async (controller: string) => {
        let account = await new MixAccount(this, controller).init()
        if (!account.contract) {
          return
        }
        let startingBlock = await this.$mixClient.web3.eth.getBlockNumber()
        account.contract.events.ReceiveMix({
          fromBlock: 0,
          toBlock: 'pending',
        })
        .on('data', (log: any) => {
          let payment = {
            transaction: log.transactionHash,
            sender: log.returnValues.from,
            amount: log.returnValues.value.toString(),
          }
          // Only show notifications for TX that occurred since logging in.
          if (log.blockNumber >= startingBlock) {
            let notification = this.$notifications.mixReceived(account.contractAddress, this.$mixClient.formatWei(payment.amount))
            new Notification(notification.title, notification)
          }
          this.$db.get('/account/contract/' + account.contractAddress + '/receivedIndex/' + log.transactionHash + '/' + log.logIndex)
          .then((id: string) => {
            return this.$db.put('/account/contract/' + account.contractAddress + '/received/' + id, JSON.stringify(payment))
          })
          .catch((error: any) => {
            let id: number
            return this.$db.get('/account/contract/' + account.contractAddress + '/receivedCount')
            .then((count: number) => {
              id = count
            })
            .catch((err: any) => {
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
            if (account.isUnlocked()) {
              account.consolidateMix()
            }
          })
        })
        .on('changed', (log: any) => {
          this.$db.get('/account/contract/' + account.contractAddress + '/receivedIndex/' + log.transactionHash + '/' + log.logIndex)
          .then((id: string) => {
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
      mentionNotifications.launch(this.$root)
      transcoder.init(this.$root)
      window.onbeforeunload = (e: any) => {
        mentionNotifications.kill()
        transcoder.kill()
      }
    },
  })
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

  $navbar-dropdown-background-color: $dark;
  $navbar-dropdown-color: $grey-lighter;
  $navbar-dropdown-item-active-color: $grey-lighter;
  $navbar-dropdown-item-hover-background-color: $blue;
  $navbar-dropdown-item-hover-color: $grey-lighter;

  .control .select select option {
      color: $grey-lighter;
  }

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

  @import url('https://fonts.googleapis.com/css?family=Noto+Sans+HK:400,700|Noto+Sans+JP:400,700|Noto+Sans+KR:400,700|Noto+Sans+TC:400,700|Noto+Sans:400,700|Noto+Serif+JP:400,700|Noto+Serif+KR:400,700|Noto+Serif+SC:400,700|Noto+Serif+TC:400,700|Noto+Serif:400,700|Source+Code+Pro&display=swap&subset=chinese-hongkong,chinese-simplified,chinese-traditional,cyrillic,cyrillic-ext,devanagari,greek,greek-ext,japanese,korean,latin-ext,vietnamese');

  html body, html button, html input, html select {
    font-family: "Noto Sans", sans-serif;
  }

  html textarea.textarea {
    font-family: "Noto Sans", sans-serif;
  }

  html code {
    font-family: 'Source Code Pro', monospace;
  }

  html button {
    font-weight: bold;
  }

  .menu-label, .menu-list {
    line-height: .85;
  }

  .markdown p {
    margin-top: 1em;
    margin-bottom: 1em;
    margin-left: 0;
    margin-right: 0;
  }

  .markdown blockquote {
    margin-top: 1em;
    margin-bottom: 1em;
    margin-left: 40px;
    margin-right: 40px;
  }

  .markdown hr {
    margin-top: 0.5em;
    margin-bottom: 0.5em;
    margin-left: auto;
    margin-right: auto;
    border-style: solid;
    border-width: 1px;
  }

  .markdown h1 {
    font-size: 2em;
    margin-top: 0.67em;
    margin-bottom: 0.67em;
    margin-left: 0px;
    margin-right: 0px;
    font-weight: bold;
  }

  .markdown h2 {
    font-size: 1.5em;
    margin-top: 0.83em;
    margin-bottom: 0.83em;
    margin-left: 0px;
    margin-right: 0px;
    font-weight: bold;
  }

  .markdown h3 {
    font-size: 1.17em;
    margin-top: 1em;
    margin-bottom: 1em;
    margin-left: 0px;
    margin-right: 0px;
    font-weight: bold;
  }

  .markdown h4 {
    margin-top: 1.33em;
    margin-bottom: 1.33em;
    margin-left: 0;
    margin-right: 0;
    font-weight: bold;
  }

  .markdown h5 {
    font-size: .83em;
    margin-top: 1.67em;
    margin-bottom: 1.67em;
    margin-left: 0;
    margin-right: 0;
    font-weight: bold;
  }

  .markdown h6 {
    font-size: .67em;
    margin-top: 2.33em;
    margin-bottom: 2.33em;
    margin-left: 0;
    margin-right: 0;
    font-weight: bold;
  }

  .markdown ul {
    list-style-type: disc;
    margin-top: 1em;
    margin-bottom: 1em;
    margin-left: 0px;
    margin-right: 0px;
    padding-left: 40px;
  }

  .markdown ol {
    list-style-type: decimal;
    margin-top: 1em;
    margin-bottom: 1em;
    margin-left: 0px;
    margin-right: 0px;
    padding-left: 40px;
  }

  .markdown dd {
    margin-left: 40px;
  }

  .markdown dl {
    margin-top: 1em;
    margin-bottom: 1em;
    margin-left: 0;
    margin-right: 0;
  }
</style>

<style scoped>

  .fade-leave-active {
    transition: opacity 0.5s ease-in;
  }

  .fade-leave-to {
    opacity: 0;
  }

  #router-view {
    padding: 2em;
    top: 0;
    margin-top: 52px;
    position: absolute;
    width: 100%;
    overflow-x: auto;
  }

  :focus {
    outline: none;
  }
</style>
