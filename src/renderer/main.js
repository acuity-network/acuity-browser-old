import Vue from 'vue'
import AsyncComputed from 'vue-async-computed'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'

import Buefy from 'buefy'
import 'buefy/lib/buefy.css'

Vue.use(Buefy)

import itemProto from './item_pb.js'
Vue.prototype.$itemProto = itemProto

import languageProto from './language_pb.js'
Vue.prototype.$languageProto = languageProto

import titleProto from './title_pb.js'
Vue.prototype.$titleProto = titleProto

import bodyTextProto from './body_pb.js'
Vue.prototype.$bodyTextProto = bodyTextProto

import descriptionProto from './description_pb.js'
Vue.prototype.$descriptionProto = descriptionProto

import jpegImageProto from './jpeg-image_pb.js'
Vue.prototype.$jpegImageProto = jpegImageProto

require('./brotli.js')
Vue.prototype.$bro = new Brotli('/static/')

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

Vue.use(AsyncComputed)

var level = require('level')
import { remote } from 'electron'
import path from 'path'
var dbPath = path.join(remote.app.getPath('userData'), '/state.db')
console.log('Initializing database: ' + dbPath)
var db = level(dbPath)
Vue.prototype.$db = db

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
