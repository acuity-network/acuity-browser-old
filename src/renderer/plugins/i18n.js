import Vue from 'vue';
import VueI18n from 'vue-i18n';

Vue.use(VueI18n);

const messages = {
  'en': {
    general: 'General',
    home: 'Home',
    feeds: 'Feeds',
    subscriptions: 'Subscriptions',
    interactions: 'Interactions',
    browsingHistory: 'Browsing History',
    publishItem: 'Publish Item',
    goTo: 'Goto',
    account: 'Account',
    transactionHistory: 'Transaction History',
    profile: 'Profile',
    trustedAccounts: 'Trusted Accounts',
    wallet: 'Wallet',
    tokens: 'Tokens',
    administration: 'Administration',
    accounts: 'Accounts',
    nodeStatus: 'Node Status',
    settings: 'Settings',
    debug: 'Debug'
  },
  'ru': {
    general: 'Общие',
    home: 'Домой',
    feeds: 'Новости',
    subscriptions: 'Подписки',
    interactions: 'Взаимосвязи',
    browsingHistory: 'История браузера',
    publishItem: 'Опубликовать',
    goTo: 'Перейти к',
    account: 'Аккаунт',
    transactionHistory: 'История транзакций',
    profile: 'Профиль',
    trustedAccounts: 'Доверенные аккаунты',
    wallet: 'Кошелек',
    tokens: 'Токены',
    administration: 'Администрирование',
    accounts: 'Аккаунт',
    nodeStatus: 'Статус подключения',
    settings: 'Настройки',
    debug: 'Отладка'
  }
}

const i18n = new VueI18n({
    locale: 'en', // set locale
    fallbackLocale: 'ru', // set fallback locale
    messages, // set locale messages
  });

export default i18n;
  