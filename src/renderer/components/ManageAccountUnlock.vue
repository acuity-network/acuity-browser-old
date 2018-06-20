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
          <b-field label="Password">
            <b-input type="password" id="password"></b-input>
          </b-field>
          <b-field label="Duration">
            <b-input type="number" id="duration"></b-input>
          </b-field>
          <button class="button is-primary" v-on:click="unlock">Unlock</button>
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
        return this.$web3.eth.personal.unlockAccount(this.$route.params.address, document.getElementById('password').value)
        .then(result => {
          console.log(result)
        })
      }
    }
  }
</script>
