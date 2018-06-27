<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">New account</h1>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <b-field label="Password">
            <b-input type="password" id="password"></b-input>
          </b-field>
          <b-field label="Repeat password">
            <b-input type="password" id="repeat-password"></b-input>
          </b-field>
          <button class="button is-primary" v-on:click="create">Create account</button>
          </div>
      </section>
    </main>
  </div>
</template>

<script>
  export default {
    name: 'new-account',
    components: {},
    methods: {
      create (event) {
        this.$web3.eth.personal.newAccount(document.getElementById('password').value)
      }
    }
  }
</script>
