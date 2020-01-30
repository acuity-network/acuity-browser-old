import Vue from 'vue'
import Router from 'vue-router'
Vue.use(Router)

function loadView(view) {
  return () => import(/* webpackChunkName: "view-[request]" */ `../components/routes/${view}.vue`)
}

export default new Router({
  routes: [
    {
      path: '/item/:encodedItemId',
      name: 'item',
      component: loadView('ViewItem'),
      props: true,
    },
    {
      path: '/topic/:topicHash',
      name: 'topic',
      component: loadView('ViewTopic'),
      props: true,
    },
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      name: 'home',
      component: loadView('Home'),
    },
    {
      path: '/feeds',
      name: 'feeds',
      component: loadView('Feeds'),
    },
    {
      path: '/subscriptions',
      name: 'subscriptions',
      component: loadView('Subscriptions'),
    },
    {
      path: '/interactions',
      name: 'interactions',
      component: loadView('Interactions'),
    },
    {
      path: '/goto',
      name: 'goto',
      component: loadView('Goto'),
    },
    {
      path: '/transaction-history',
      name: 'transaction-history',
      component: loadView('TransactionHistory'),
    },
    {
      path: '/browsing-history',
      name: 'browsing-history',
      component: loadView('BrowsingHistory'),
    },
    {
      path: '/publish-item',
      name: 'publish-item',
      component: loadView('PublishItem'),
    },
    {
      path: '/publish-item/mixin-type',
      name: 'publish-mixin-type',
      component: loadView('PublishMixinType'),
    },
    {
      path: '/publish-item/image',
      name: 'publish-image',
      component: loadView('PublishImage'),
    },
    {
      path: '/publish-item/feed',
      name: 'publish-feed',
      component: loadView('PublishFeed'),
    },
    {
      path: '/publish-item/file',
      name: 'publish-file',
      component: loadView('PublishFile'),
    },
    {
      path: '/publish-item/video',
      name: 'publish-video',
      component: loadView('PublishVideo'),
    },
    {
      path: '/profile/edit',
      name: 'profile-edit',
      component: loadView('ProfileEdit'),
    },
    {
      path: '/trusted-accounts',
      name: 'trusted-accounts',
      component: loadView('TrustedAccounts'),
    },
    {
      path: '/wallet',
      name: 'wallet',
      component: loadView('Wallet'),
    },
    {
      path: '/tokens',
      name: 'tokens',
      component: loadView('Tokens'),
    },
    {
      path: '/tokens/create',
      name: 'tokens-create',
      component: loadView('CreateToken'),
    },
    {
      path: '/manage-accounts',
      name: 'manage-accounts',
      component: loadView('ManageAccounts'),
    },
    {
      path: '/manage-accounts/new',
      name: 'manage-accounts-new',
      component: loadView('ManageAccountsNew'),
    },
    {
      path: '/manage-accounts/recover',
      name: 'manage-accounts-recover',
      component: loadView('ManageAccountsRecover'),
    },
    {
      path: '/manage-accounts/controller/:controllerAddress',
      name: 'manage-account-activate',
      component: loadView('ManageAccountActivate'),
      props: true,
    },
    {
      path: '/manage-accounts/delete/:controllerAddress',
      name: 'manage-account-delete',
      component: loadView('ManageAccountDelete'),
      props: true,
    },
    {
      path: '/transcoding',
      name: 'transcoding',
      component: loadView('Transcoding'),
    },
    {
      path: '/node-status',
      name: 'node-status',
      component: loadView('NodeStatus'),
    },
    {
      path: '/mining',
      name: 'mining',
      component: loadView('Mining'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: loadView('Settings'),
    },
    {
      path: '/debug',
      name: 'debug',
      component: loadView('Debug'),
    },
    {
      path: '/downloads',
      name: 'downloads',
      component: loadView('Downloads'),
    }

  ]
})
