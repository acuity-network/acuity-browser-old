import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'

import Buefy from 'buefy'
import 'buefy/dist/buefy.css'
Vue.use(Buefy)

import VueTimeago from 'vue-timeago'
Vue.use(VueTimeago)


import '@mdi/font/css/materialdesignicons.min.css'
import 'notosans-fontface/css/notosans-fontface.css'
import 'typeface-montserrat/index.css'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false
Vue.config.debug = true

var level = require('level')
import { remote } from 'electron'
import path from 'path'
var dbPath = path.join(remote.app.getPath('userData'), '/state.db')
console.log('Initializing database: ' + dbPath)
var db = level(dbPath)
Vue.prototype.$db = db

const Web3 = require('web3')
var net = require('net')
Vue.prototype.$web3 = new Web3(new Web3.providers.IpcProvider('/home/jbrown/.mix-geth/geth.ipc', net))
//Vue.prototype.$web3 = new Web3(new Web3.providers.IpcProvider('/home/jbrown/.ethereum/geth.ipc', net))
//Vue.prototype.$web3 = new Web3(new Web3.providers.IpcProvider('/home/jbrown/mix-blockchain/mix.ipc', net))
//Vue.prototype.$web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8645'))
Vue.prototype.$web3.eth.defaultBlock = 'pending';
Vue.prototype.$itemStoreIpfsSha256 = new Vue.prototype.$web3.eth.Contract(require('../lib/ItemStoreIpfsSha256.abi.json'), '0xe059665fe0d226f00c72e3982d54bddf4be19c6c')
Vue.prototype.$accountProfile = new Vue.prototype.$web3.eth.Contract(require('../lib/AccountProfile.abi.json'), '0x72f52ab6b1d15630ee9b2d8763b23478c0327df8')
Vue.prototype.$itemStoreShortId = new Vue.prototype.$web3.eth.Contract(require('../lib/ItemStoreShortId.abi.json'), '0xd02ee768718b41a8cea9350d7c4c443727da5c7b')
Vue.prototype.$trustedAccounts = new Vue.prototype.$web3.eth.Contract(require('../lib/TrustedAccounts.abi.json'), '0xaae497797e3f9a5ff341225bd9696d9759991418')

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
