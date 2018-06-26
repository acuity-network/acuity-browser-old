<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">Unlock account</h1>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="container">
          <form v-on:submit="unlock">
            <b-field label="Password">
              <b-input type="password" id="password" password-reveal></b-input>
            </b-field>
            <button type="submit" class="button is-primary">Unlock</button>
          </form>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
  export default {
    name: 'manage-account-unlock',
    components: {},
    asyncComputed: {
    },
    methods: {
      unlock() {
        return this.$web3.eth.personal.unlockAccount(this.$route.params.address, document.getElementById('password').value, 0)
        .then(result => {
          this.$router.push({name: 'manage-accounts'})
        })
        .catch(error => {
          console.log(error)
        })
      }
    }
  }
</script>
