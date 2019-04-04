<template>
  <page>
    <template slot="title">
      Manage account
    </template>

    <template slot="body">
      <img :src="qrcode" />
      <b-field label="Balance">
        {{ balance }} MIX
      </b-field>
      <b-field label="Controller">
        {{ controller }}
      </b-field>
      <b-field label="Contract">
        {{ contract }}
      </b-field>

      <button class="button is-primary" v-on:click="activate">Activate account</button>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  var QRCode = require('qrcode')
  import MixAccount from '../../lib/MixAccount.js'

  export default {
    name: 'manage-account-controller',
    components: {
      Page,
    },
    data() {
      return {
        qrcode: '',
        controller: '',
        contract: '',
        balance: '',
      }
    },
    methods: {
      activate() {
//        if(this.balance > 0) {
          let account = new MixAccount(this, this.$route.params.address)
          return account.deploy()
/*        } else {
          new Notification(this.$notifications.fundAccount.title, this.$notifications.fundAccount)
        }
*/
      }
    },
    async created() {
      this.qrcode = await QRCode.toDataURL(this.$route.params.address, {
        mode: 'alphanumeric',
        errorCorrectionLevel: 'H'
      })
 
      this.controller = this.$route.params.address
      this.contract = await this.$db.get('/account/controller/' + this.$route.params.address + '/contract')
    
      this.balance = this.$web3.utils.fromWei(await this.$web3.eth.getBalance(this.$route.params.address, 'pending'))
    },
  }
</script>
