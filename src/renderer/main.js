import Vue from 'vue'

import App from './App'
import router from './router'
import { ipcRenderer } from 'electron'

import Buefy from 'buefy'
Vue.use(Buefy)

import VueTimeago from 'vue-timeago'
Vue.use(VueTimeago, { locale: 'en' })

import i18n from './plugins/i18n';

import '@mdi/font/css/materialdesignicons.min.css'
import 'notosans-fontface/css/notosans-fontface.css'

import VueElectron from 'vue-electron'
Vue.use(VueElectron)

let axios = require('axios')
// Attempt to use http adapter (this doesn't work).
axios.defaults.adapter = require('axios/lib/adapters/http');
Vue.http = Vue.prototype.$http = axios

import level from 'level'
import { remote } from 'electron'
import path from 'path'
let dbPath = path.join(remote.app.getPath('userData'), 'state.db')
console.log('Initializing database: ' + dbPath)
Vue.prototype.$db = level(dbPath)

import Web3 from 'web3'
import net from 'net'
import os from 'os'

let parityIpcPath

if (os.platform() === 'win32') {
  parityIpcPath = '\\\\.\\pipe\\mix.ipc'
}
else {
  parityIpcPath = path.join(remote.app.getPath('userData'), 'parity.ipc')
}

Vue.prototype.$web3 = new Web3(new Web3.providers.IpcProvider(parityIpcPath, net))
Vue.prototype.$web3.eth.defaultBlock = 'pending';

Vue.prototype.$itemStoreRegistry = new Vue.prototype.$web3.eth.Contract(require('../lib/ItemStoreRegistry.abi.json'), '0x8928f846012b98aac5cd2f4ef4029097cd4110fc')
Vue.prototype.$itemStoreIpfsSha256 = new Vue.prototype.$web3.eth.Contract(require('../lib/ItemStoreIpfsSha256.abi.json'), '0x1c12e8667bd48f87263e0745d7b28ea18f74ac0e')
Vue.prototype.$itemStoreShortId = new Vue.prototype.$web3.eth.Contract(require('../lib/ItemStoreShortId.abi.json'), '0xe8912dd1dc35bbd613dbc5f30fe8b20300ec9f79')
Vue.prototype.$itemDagComments = new Vue.prototype.$web3.eth.Contract(require('../lib/ItemDagOneParent.abi.json'), '0x8e7f6a1696b0e702ac1701b9048c47783483330e')
Vue.prototype.$itemDagFeedItems = new Vue.prototype.$web3.eth.Contract(require('../lib/ItemDag.abi.json'), '0xd6cc1712b46a599f87f023fad83bc06473bb2b8d')
Vue.prototype.$accountProfile = new Vue.prototype.$web3.eth.Contract(require('../lib/AccountProfile.abi.json'), '0x7855a6b883c39c8e87d51002b064180ddbf16026')
Vue.prototype.$trustedAccounts = new Vue.prototype.$web3.eth.Contract(require('../lib/TrustedAccounts.abi.json'), '0x11dc5cf838ae3850458f92474dc28d1e47f8e045')
Vue.prototype.$reactions = new Vue.prototype.$web3.eth.Contract(require('../lib/MixReactions.abi.json'), '0xc66af5a7e3699d5b9f03a6031ca8568dae7b6bd1')

Vue.prototype.$tokenRegistryAddress = '0x71387fc1fc8238cb80d3ca3d67d07bb672a3a8d8'
Vue.prototype.$tokenRegistry = new Vue.prototype.$web3.eth.Contract(require('../lib/MixTokenRegistry.abi.json'), Vue.prototype.$tokenRegistryAddress)

ipcRenderer.on('parity-error', (event, error) => {
  console.log('Parity error: ' + error)
})

import notifications from '../lib/notifications.js'
Vue.prototype.$notifications = notifications

import Settings from '../lib/Settings.js'
Vue.prototype.$settings = new Settings()

import ipfsClient from '../lib/IpfsClient.js'
Vue.prototype.$ipfsClient = ipfsClient

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  i18n,
  template: '<App/>'
}).$mount('#app')
