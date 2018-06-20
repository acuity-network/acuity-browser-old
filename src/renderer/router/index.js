import Vue from 'vue'
import Router from 'vue-router'
import Web3 from 'web3'

Vue.prototype.$web3 = new Web3('http://localhost:8645')

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/item/:itemId',
      name: 'item',
      component: require('@/components/ViewItem').default
    },
    {
      path: '*',
      redirect: '/home'
    },
    {
      path: '/home',
      name: 'home',
      component: require('@/components/Home').default
    },
    {
      path: '/feeds',
      name: 'feeds',
      component: require('@/components/Feeds').default
    },
    {
      path: '/interactions',
      name: 'interactions',
      component: require('@/components/Interactions').default
    },
    {
      path: '/browsing-history',
      name: 'browsing-history',
      component: require('@/components/BrowsingHistory').default
    },
    {
      path: '/publish-item',
      name: 'publish-item',
      component: require('@/components/PublishItem').default
    },
    {
      path: '/publish-item/mixin-type',
      name: 'publish-mixin-type',
      component: require('@/components/PublishMixinType').default
    },
    {
      path: '/publish-item/image',
      name: 'publish-image',
      component: require('@/components/PublishImage').default
    },
    {
      path: '/profile',
      name: 'profile',
      component: require('@/components/Profile').default
    },
    {
      path: '/profile/edit',
      name: 'profile-edit',
      component: require('@/components/ProfileEdit').default
    },
    {
      path: '/trusted-accounts',
      name: 'trusted-accounts',
      component: require('@/components/TrustedAccounts').default
    },
    {
      path: '/wallet',
      name: 'wallet',
      component: require('@/components/Wallet').default
    },
    {
      path: '/manage-accounts',
      name: 'manage-accounts',
      component: require('@/components/ManageAccounts').default
    },
    {
      path: '/manage-accounts/new',
      name: 'new-account',
      component: require('@/components/NewAccount').default
    },
    {
      path: '/manage-accounts/controller/:address',
      name: 'manage-account-controller',
      component: require('@/components/ManageAccountController').default
    },
    {
      path: '/manage-accounts/unlock/:address',
      name: 'manage-account-unlock',
      component: require('@/components/ManageAccountUnlock').default
    },
    {
      path: '/node-status',
      name: 'node-status',
      component: require('@/components/NodeStatus').default
    },
    {
      path: '/settings',
      name: 'settings',
      component: require('@/components/Settings').default
    },
    {
      path: '/search',
      name: 'search',
      component: require('@/components/Search').default
    },
    {
      path: '/debug',
      name: 'debug',
      component: require('@/components/Debug').default
    },
    {
      path: '/block-explorer',
      name: 'block-explorer',
      component: require('@/components/BlockExplorer').default
    }
  ]
})
