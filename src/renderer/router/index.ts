import Vue from 'vue'
import Router from 'vue-router'
Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/item/:encodedItemId',
      name: 'item',
      component: require('../components/routes/ViewItem').default,
      props: true,
    },
    {
      path: '/topic/:topicHash',
      name: 'topic',
      component: require('../components/routes/ViewTopic').default,
      props: true,
    },
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      name: 'home',
      component: require('../components/routes/Home').default
    },
    {
      path: '/feeds',
      name: 'feeds',
      component: require('../components/routes/Feeds').default
    },
    {
      path: '/subscriptions',
      name: 'subscriptions',
      component: require('../components/routes/Subscriptions').default
    },
    {
      path: '/interactions',
      name: 'interactions',
      component: require('../components/routes/Interactions').default
    },
    {
      path: '/goto',
      name: 'goto',
      component: require('../components/routes/Goto').default
    },
    {
      path: '/transaction-history',
      name: 'transaction-history',
      component: require('../components/routes/TransactionHistory').default
    },
    {
      path: '/browsing-history',
      name: 'browsing-history',
      component: require('../components/routes/BrowsingHistory').default
    },
    {
      path: '/publish-item',
      name: 'publish-item',
      component: require('../components/routes/PublishItem').default
    },
    {
      path: '/publish-item/mixin-type',
      name: 'publish-mixin-type',
      component: require('../components/routes/PublishMixinType').default
    },
    {
      path: '/publish-item/image',
      name: 'publish-image',
      component: require('../components/routes/PublishImage').default
    },
    {
      path: '/publish-item/feed',
      name: 'publish-feed',
      component: require('../components/routes/PublishFeed').default
    },
    {
      path: '/publish-item/file',
      name: 'publish-file',
      component: require('../components/routes/PublishFile').default
    },
    {
      path: '/publish-item/video',
      name: 'publish-video',
      component: require('../components/routes/PublishVideo').default
    },
    {
      path: '/profile/edit',
      name: 'profile-edit',
      component: require('../components/routes/ProfileEdit').default
    },
    {
      path: '/trusted-accounts',
      name: 'trusted-accounts',
      component: require('../components/routes/TrustedAccounts').default
    },
    {
      path: '/wallet',
      name: 'wallet',
      component: require('../components/routes/Wallet').default
    },
    {
      path: '/tokens',
      name: 'tokens',
      component: require('../components/routes/Tokens').default
    },
    {
      path: '/tokens/create',
      name: 'tokens-create',
      component: require('../components/routes/CreateToken').default
    },
    {
      path: '/manage-accounts',
      name: 'manage-accounts',
      component: require('../components/routes/ManageAccounts').default
    },
    {
      path: '/manage-accounts/new',
      name: 'manage-accounts-new',
      component: require('../components/routes/ManageAccountsNew').default
    },
    {
      path: '/manage-accounts/recover',
      name: 'manage-accounts-recover',
      component: require('../components/routes/ManageAccountsRecover').default
    },
    {
      path: '/manage-accounts/controller/:controllerAddress',
      name: 'manage-account-activate',
      component: require('../components/routes/ManageAccountActivate').default,
      props: true,
    },
    {
      path: '/manage-accounts/delete/:controllerAddress',
      name: 'manage-account-delete',
      component: require('../components/routes/ManageAccountDelete').default,
      props: true,
    },
    {
      path: '/transcoding',
      name: 'transcoding',
      component: require('../components/routes/Transcoding').default
    },
    {
      path: '/node-status',
      name: 'node-status',
      component: require('../components/routes/NodeStatus').default
    },
    {
      path: '/mining',
      name: 'mining',
      component: require('../components/routes/Mining').default
    },
    {
      path: '/settings',
      name: 'settings',
      component: require('../components/routes/Settings').default
    },
    {
      path: '/debug',
      name: 'debug',
      component: require('../components/routes/Debug').default
    },
    {
      path: '/downloads',
      name: 'downloads',
      component: require('../components/routes/Downloads').default
    }

  ]
})
