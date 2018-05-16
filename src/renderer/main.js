import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'

import mixinProto from './mixin_pb.js'

import itemProto from './item_pb.js'
Vue.prototype.$mixinProto = mixinProto
Vue.prototype.$itemProto = itemProto

require('./brotli.js')
Vue.prototype.$bro = new Brotli('/static/')

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
