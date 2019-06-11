import Vue from 'vue'
import Router from 'vue-router'
Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/item/:itemId',
      name: 'item',
      component: require('@/components/ViewItem').default,
      props: true,
    },
    {
      path: '*',
      redirect: '/node-status',
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
      path: '/subscriptions',
      name: 'subscriptions',
      component: require('@/components/Subscriptions').default
    },
    {
      path: '/interactions',
      name: 'interactions',
      component: require('@/components/Interactions').default
    },
    {
      path: '/goto',
      name: 'goto',
      component: require('@/components/Goto').default
    },
    {
      path: '/transaction-history',
      name: 'transaction-history',
      component: require('@/components/TransactionHistory').default
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
      path: '/publish-item/feed',
      name: 'publish-feed',
      component: require('@/components/PublishFeed').default
    },
    {
      path: '/publish-item/file',
      name: 'publish-file',
      component: require('@/components/PublishFile').default
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
      path: '/tokens',
      name: 'tokens',
      component: require('@/components/CreateToken').default
    },
    {
      path: '/manage-accounts',
      name: 'manage-accounts',
      component: require('@/components/ManageAccounts').default
    },
    {
      path: '/manage-accounts/new',
      name: 'manage-accounts-new',
      component: require('@/components/ManageAccountsNew').default
    },
    {
      path: '/manage-accounts/controller/:controllerAddress',
      name: 'manage-account-activate',
      component: require('@/components/ManageAccountActivate').default,
      props: true,
    },
    {
      path: '/node-status',
      name: 'node-status',
      component: require('@/components/NodeStatus').default
    },
    {
      path: '/mining',
      name: 'mining',
      component: require('@/components/Mining').default
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
      path: '/recover-account',
      name: 'recover-account',
      component: require('@/components/RecoverAccount').default
    },
    {
      path: '/downloads',
      name: 'downloads',
      component: require('@/components/Downloads').default
    }

  ]
})
