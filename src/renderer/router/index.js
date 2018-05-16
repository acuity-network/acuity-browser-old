import Vue from 'vue'
import Router from 'vue-router'
import Web3 from 'web3'

Vue.prototype.$web3 = new Web3('http://localhost:8645')

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'publish-mixin-type',
      component: require('@/components/PublishMixinType').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
