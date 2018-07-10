<template>
  <div class="modal-card" style="width: auto">
    <header class="modal-card-head">
      <p class="modal-card-title">Send</p>
    </header>
    <section class="modal-card-body">
      <b-field label="To">
        {{ to }}
      </b-field>

      <b-field label="Amount">
        {{ amount }} MIX
      </b-field>

      <b-field label="Comment">
      {{ comment }}
      </b-field>
    </section>
    <footer class="modal-card-foot">
      <button class="button" type="button" @click="$parent.close()">Close</button>
      <button class="button is-primary"type="button" @click="send">Send</button>
    </footer>
  </div>
</template>

<script>
  import MixAccount from '../../lib/MixAccount.js'

  export default {
    name: 'walletConfirmSend',
    props: ['to', 'amount', 'comment'],
    methods: {
      send (event) {
        var account = new MixAccount(this, this.$web3.eth.defaultAccount)
        account.init()
        .then(() => {
          return account.sendMix(this.to, this.$web3.utils.toWei(this.amount), this.comment)
        })
        .then(() => {
          this.$parent.$parent.loadData(account)
          this.$emit('close')
        })
      },
    },
  }
</script>
