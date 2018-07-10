<template>
  <div class="modal-card" style="width: auto">
    <header class="modal-card-head">
      <p class="modal-card-title">Unlock account</p>
    </header>
    <form v-on:submit="unlock">
      <section class="modal-card-body">
        <b-field label="Password">
          <b-input type="password" v-model="password" id="password" password-reveal></b-input>
        </b-field>
      </section>
      <footer class="modal-card-foot">
        <button class="button" type="button" @click="$parent.close()">Close</button>
        <button class="button is-primary" type="button" @click="unlock">Unlock</button>
      </footer>
    </form>
  </div>
</template>

<script>
  export default {
    name: 'manage-account-unlock',
    props: ['address'],
    data() {
      return {
        password: ''
      }
    },
    mounted() {
      document.getElementById('password').focus()
    },
    methods: {
      unlock() {
        this.$web3.eth.personal.unlockAccount(this.address, this.password, 0)
        .then(result => {
          this.$parent.$parent.loadAccounts()
          this.$emit('close')
        })
        .catch(error => {
          console.log(error)
        })
      },
    }
  }
</script>
