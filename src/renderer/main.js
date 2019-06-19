import Vue from 'vue'

import App from './App'
import router from './router'

router.afterEach((to, from) => {
  // Ensure arrow keys work after clicking on route.
  document.getElementById('router-view').focus()
})

import { ipcRenderer } from 'electron'

import Buefy from 'buefy'
Vue.use(Buefy)

import VueTimeago from 'vue-timeago'
Vue.use(VueTimeago, { locale: 'en' })

import i18n from './plugins/i18n';

import '@mdi/font/css/materialdesignicons.min.css'
import 'notosans-fontface/css/notosans-fontface.css'
import 'typeface-noto-serif/index.css'

import axios from 'axios'
Vue.http = Vue.prototype.$http = axios

import level from 'level'
import { remote } from 'electron'
import path from 'path'
let dbPath = path.join(remote.app.getPath('userData'), 'state.db')
console.log('Initializing database: ' + dbPath)
Vue.prototype.$db = level(dbPath)

import MixClient from '../lib/MixClient.js'
Vue.prototype.$mixClient = new MixClient()

import notifications from '../lib/notifications.js'
Vue.prototype.$notifications = notifications

import Settings from '../lib/Settings.js'
Vue.prototype.$settings = new Settings()

import IpfsClient from '../lib/IpfsClient.js'
Vue.prototype.$ipfsClient = new IpfsClient()

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  i18n,
  template: '<App/>'
}).$mount('#app')
