<template>
  <div class="modal-card" style="width: auto">
    <header class="modal-card-head">
      <p class="modal-card-title">New account</p>
    </header>
    <section class="modal-card-body">
      <b-field label="Password">
        <b-input type="password" v-model="password" id="password" password-reveal></b-input>
      </b-field>
      <b-field label="Repeat password">
        <b-input type="password" v-model="passwordRepeat" password-reveal></b-input>
      </b-field>
    </section>
    <footer class="modal-card-foot">
      <button class="button" type="button" @click="$parent.close()">Close</button>
      <button class="button is-primary" type="button" @click="create">Create account</button>
    </footer>
  </div>
</template>

<script>
  export default {
    name: 'new-account',
    data() {
      return {
        password: '',
        passwordRepeat: '',
      }
    },
    mounted() {
      document.getElementById('password').focus()
    },
    methods: {
      create(event) {
        this.$web3.eth.personal.newAccount(this.password)
        .then(() => {
          this.$parent.$parent.loadAccounts()
          this.$emit('close')
        })
        .catch(error => {
          console.log(error)
        })
      }
    }
  }
</script>
