<template>
  <div id="app">
    <router-view></router-view>
    <nav class="navbar is-fixed-bottom" role="navigation" aria-label="main navigation">
      <div class="navbar-menu is-active">
        <div class="navbar-start">
          <a class="navbar-item" href="/home" title="Home"><img src="/static/icons/home.svg" width="64" height="64"></a>
          <a class="navbar-item" href="/feeds" title="Feeds"><img src="/static/icons/feeds.svg" width="64" height="64"></a>
          <a class="navbar-item" href="/interactions" title="Interactions"><img src="/static/icons/interactions.svg" width="64" height="64"></a>
          <a class="navbar-item" href="/browsing-history" title="Browsing history"><img src="/static/icons/browsing-history.svg" width="64" height="64"></a>
          <a class="navbar-item" href="/new-post" title="New post"><img src="/static/icons/new-post.svg" width="64" height="64"></a>
          <a class="navbar-item" href="/profile" title="Profile"><img src="/static/icons/profile.svg" width="64" height="64"></a>
          <a class="navbar-item" href="/trusted-accounts" title="Trusted accounts"><img src="/static/icons/trusted-accounts.svg" width="64" height="64"></a>
          <a class="navbar-item" href="/wallet" title="Wallet"><img src="/static/icons/wallet.svg" width="64" height="64"></a>
          <a class="navbar-item" href="/manage-accounts" title="Manage accounts"><img src="/static/icons/manage-accounts.svg" width="64" height="64"></a>
          <a class="navbar-item" href="/node-status" title="Node status"><img src="/static/icons/node-info.svg" width="64" height="64"></a>
          <a class="navbar-item" href="/settings" title="Settings"><img src="/static/icons/settings.svg" width="64" height="64"></a>
          <a class="navbar-item" href="/search" title="Search"><img src="/static/icons/search.svg" width="64" height="64"></a>
          <a class="navbar-item" href="/debug" title="Debug"><img src="/static/icons/debug.svg" width="64" height="64"></a>
        </div>
      </div>
    </nav>
  </div>
</template>

<script>
  export default {
    name: 'd-web'
  }
</script>

<style>
  .navbar-item img {
    width: 64px;
    height: 64px;
    max-height: none;
  }

  .navbar-menu {
    padding: 0 4px 0 4px;
  }

  .navbar-item {
    padding: 8px 4px 8px 4px;
  }

  .navbar-item a {
    padding: 0;
  }

</style>
