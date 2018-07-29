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
  import MixAccount from '../../lib/MixAccount.js'

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
        var account = new MixAccount(this, this.address)
        account.init()
        account.unlock(this.password)
        .then(() => {
          return account.consolidateMix()
        })
        .then(() => {
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
