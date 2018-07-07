<template>
  <div class="modal-card" style="width: auto">
    <header class="modal-card-head">
      <p class="modal-card-title">Unlock account</p>
    </header>
    <form v-on:submit="unlock();$parent.close();">
      <section class="modal-card-body">
        <b-field label="Password">
          <b-input type="password" id="password" password-reveal></b-input>
        </b-field>
      </section>
      <footer class="modal-card-foot">
          <button class="button is-primary"type="button" @click="unlock();">Unlock</button>
      </footer>
    </form>
  </div>
</template>

<script>
  export default {
    name: 'manage-account-unlock',
    props: ['address'],
    methods: {
      unlock() {
        this.$web3.eth.personal.unlockAccount(this.address, document.getElementById('password').value, 0)
        .then(result => {
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
