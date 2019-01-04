import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'

import Buefy from 'buefy'
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
Vue.prototype.$web3 = new Web3(new Web3.providers.IpcProvider('/home/jbrown/.ethereum/mix/geth.ipc', net))
//Vue.prototype.$web3 = new Web3(new Web3.providers.IpcProvider('/home/jbrown/.local/share/io.parity.ethereum/jsonrpc.ipc', net))
Vue.prototype.$web3.eth.defaultBlock = 'pending';

Vue.prototype.$itemStoreRegistry = new Vue.prototype.$web3.eth.Contract(require('../lib/ItemStoreRegistry.abi.json'), '0x8928f846012b98aac5cd2f4ef4029097cd4110fc')
Vue.prototype.$itemStoreIpfsSha256 = new Vue.prototype.$web3.eth.Contract(require('../lib/ItemStoreIpfsSha256.abi.json'), '0x1c12e8667bd48f87263e0745d7b28ea18f74ac0e')
Vue.prototype.$itemStoreShortId = new Vue.prototype.$web3.eth.Contract(require('../lib/ItemStoreShortId.abi.json'), '0xe8912dd1dc35bbd613dbc5f30fe8b20300ec9f79')
Vue.prototype.$itemDagComments = new Vue.prototype.$web3.eth.Contract(require('../lib/ItemDag.abi.json'), '0xbd3af0bdcf4c8a6dfd8f6ff2129409632decfc7e')
Vue.prototype.$itemDagFeedItems = new Vue.prototype.$web3.eth.Contract(require('../lib/ItemDag.abi.json'), '0xd6cc1712b46a599f87f023fad83bc06473bb2b8d')
Vue.prototype.$accountProfile = new Vue.prototype.$web3.eth.Contract(require('../lib/AccountProfile.abi.json'), '0x7855a6b883c39c8e87d51002b064180ddbf16026')
Vue.prototype.$trustedAccounts = new Vue.prototype.$web3.eth.Contract(require('../lib/TrustedAccounts.abi.json'), '0x11dc5cf838ae3850458f92474dc28d1e47f8e045')
Vue.prototype.$reactions = new Vue.prototype.$web3.eth.Contract(require('../lib/MixReactions.abi.json'), '0xc66af5a7e3699d5b9f03a6031ca8568dae7b6bd1')

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
