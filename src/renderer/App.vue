<template>
  <div id="app">
    <router-view></router-view>
    <nav class="navbar is-fixed-bottom" role="navigation" aria-label="main navigation">
      <div class="navbar-menu is-active">
        <div class="navbar-start">
          <router-link class="navbar-item" to="/item/0x2d54bddf4be19c6c2bea6f06c5a99785341a06fd2a60c6fa853417ee7611d31c" title="Home"><img src="/static/icons/home.svg" width="64" height="64"></router-link>
          <router-link class="navbar-item" to="/feeds" title="Feeds"><img src="/static/icons/feeds.svg" width="64" height="64"></router-link>
          <router-link class="navbar-item" to="/interactions" title="Interactions"><img src="/static/icons/interactions.svg" width="64" height="64"></router-link>
          <router-link class="navbar-item" to="/browsing-history" title="Browsing history"><img src="/static/icons/browsing-history.svg" width="64" height="64"></router-link>
          <router-link class="navbar-item" to="/publish-item" title="Create item"><img src="/static/icons/new-post.svg" width="64" height="64"></router-link>
          <router-link class="navbar-item" to="/profile" title="Profile"><img src="/static/icons/profile.svg" width="64" height="64"></router-link>
          <router-link class="navbar-item" to="/trusted-accounts" title="Trusted accounts"><img src="/static/icons/trusted-accounts.svg" width="64" height="64"></router-link>
          <router-link class="navbar-item" to="/wallet" title="Wallet"><img src="/static/icons/wallet.svg" width="64" height="64"></router-link>
          <router-link class="navbar-item" to="/manage-accounts" title="Manage accounts"><img src="/static/icons/manage-accounts.svg" width="64" height="64"></router-link>
          <router-link class="navbar-item" to="/node-status" title="Node status"><img src="/static/icons/node-info.svg" width="64" height="64"></router-link>
          <router-link class="navbar-item" to="/settings" title="Settings"><img src="/static/icons/settings.svg" width="64" height="64"></router-link>
          <router-link class="navbar-item" to="/search" title="Search"><img src="/static/icons/search.svg" width="64" height="64"></router-link>
          <router-link class="navbar-item" to="/debug" title="Debug"><img src="/static/icons/debug.svg" width="64" height="64"></router-link>
          <router-link class="navbar-item" to="/block-explorer" title="Block explorer"><img src="/static/icons/block-explorer.svg" width="64" height="64"></router-link>
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
