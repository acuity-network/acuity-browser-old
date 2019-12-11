import 'setimmediate'
import Vue from 'vue'
import Vuex from 'vuex'
import App from './App.vue'
import router from './router'
import db from '../lib/db'

router.afterEach((to, from) => {
  // Ensure arrow keys work after clicking on route.
  let el = document.getElementById('router-view')
  if (el) {
    el.focus()
  }
})

Vue.use(Vuex)
import VueI18n from 'vue-i18n'
Vue.use(VueI18n)

import messages from './i18n'

let i18n = new VueI18n({
  messages,
});

import Buefy from 'buefy'
Vue.use(Buefy)

import VueTimeago from 'vue-timeago'
Vue.use(VueTimeago, { locale: 'en' })

import '@mdi/font/css/materialdesignicons.min.css'

import axios from 'axios'
Vue.prototype.$http = axios

Vue.prototype.$db = db.init()

import MixClient from '../lib/MixClient'
Vue.prototype.$mixClient = new MixClient()

import notifications from '../lib/notifications'
Vue.prototype.$notifications = notifications

import Settings from '../lib/Settings'
Vue.prototype.$settings = new Settings()

import IpfsClient from '../lib/IpfsClient'
Vue.prototype.$ipfsClient = new IpfsClient()

import activeAccount from '../lib/activeAccount'
Vue.prototype.$activeAccount = activeAccount

Vue.prototype.$isDesktop = process.env.ELECTRON_WEBPACK_APP_DESKTOP == 'true'

new Vue({
  router,
  i18n,
  render: h => h(App)
}).$mount('#app')
