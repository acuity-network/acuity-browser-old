<template>
  <div class="modal-card" style="width: auto">
    <header class="modal-card-head">
      <p class="modal-card-title">Send</p>
    </header>
    <section class="modal-card-body">
      <b-field label="To">
        <code>{{ to }}</code>
      </b-field>

      <b-field label="Amount">
        {{ amount }} MIX
      </b-field>
    </section>
    <footer class="modal-card-foot">
      <button class="button" type="button" @click="$parent.close()">Close</button>
      <button class="button is-primary"type="button" @click="send">Send</button>
    </footer>
  </div>
</template>

<script>
  export default {
    name: 'walletConfirmSend',
    props: ['to', 'amount'],
    methods: {
      send (event) {
        window.activeAccount.sendMix(this.to, this.$web3.utils.toWei(this.amount))
        .then(() => {
          this.$parent.$parent.loadData()
          this.$emit('close')
        })
      },
    },
  }
</script>
