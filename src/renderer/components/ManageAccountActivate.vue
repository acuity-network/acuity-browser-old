<template>
  <page>
    <template slot="title">
      Activate account
    </template>

    <template slot="body">
      <div v-if="!activating">
        <div>Send 0.01 MIX to activate this account.</div>
        <img :src="qrcode" />
        <b-field label="Address">
          {{ controllerAddress }}
        </b-field>
        <b-field label="Balance">
          {{ balance }} MIX
        </b-field>
        <b-field label="Pending balance">
          {{ balancePending }} MIX
        </b-field>
      </div>
      <div v-else>
        Activating...
      </div>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import QRCode from 'qrcode'
  import MixAccount from '../../lib/MixAccount.js'

  export default {
    name: 'manage-account-activate',
    props: ['controllerAddress'],
    components: {
      Page,
    },
    data() {
      return {
        activating: false,
        qrcode: '',
        balance: '',
        balancePending: '',
      }
    },
    methods: {
      async update() {
        let balance = this.$web3.utils.fromWei(await this.account.getControllerBalance())
        if (!this.activating && balance >= 0.01) {
          this.activating = true
          window.clearInterval(this.intervalId)
          await this.account.deploy()
          this.account.select()
          this.$router.push({ name: 'profile-edit' })
        }
        else {
          this.balance = balance
          this.balancePending = this.$web3.utils.fromWei(await this.account.getUnconfirmedControllerBalance())
        }
      }
    },
    async created() {
      this.account = await new MixAccount(this, this.controllerAddress).init()
      if ('contractAddress' in this.account) {
        this.$router.push({ name: 'profile' })
      }
      else {
        this.qrcode = await QRCode.toDataURL(this.controllerAddress, {
          mode: 'alphanumeric',
          errorCorrectionLevel: 'H',
        })
        this.update()
        this.intervalId = window.setInterval(this.update, 500)
      }
    },
    destroyed() {
      window.clearInterval(this.intervalId)
    },
  }
</script>

<style scoped>
  img {
    padding: 20px;
  }
</style>
