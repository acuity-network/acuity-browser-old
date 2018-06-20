<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">Manage accounts</h1>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <ul>
            <li><router-link to="/manage-accounts/new">Create account</router-link></li>
          </ul>
          <ul id="accounts">
            <li v-for="account in accounts">
              <code><router-link :to="{ name: 'manage-account-controller', params: { address: account }}">{{ account }}</router-link></code>
            </li>
          </ul>
        </div>
      </section>
    </main>
  </div>
</template>

<script>

  export default {
    name: 'manage-accounts',
    components: {},
    asyncComputed: {
      accounts() {
        return this.$web3.eth.personal.getAccounts()
      }
    }
  }
</script>
