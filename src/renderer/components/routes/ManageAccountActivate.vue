<template>
  <page>
    <template slot="title">
      {{ $t('ManageAccountActivate.DeployAccount') }}
    </template>

    <template slot="body">
      <template v-if="activating">
        <b-progress type="is-info"></b-progress>
      </template>
      <template v-else>
        <b-message type="is-info">
          {{ $t('ManageAccountActivate.Info') }}
        </b-message>
        <img class="qr" :src="qrcode" />
        <b-field :label="$t('ManageAccountActivate.Address')">
          {{ controllerAddress }}
        </b-field>
        <b-field :label="$t('ManageAccountActivate.Faucet')">
          <button v-if="!faucetRequested" class="button" @click="request">{{ $t('ManageAccountActivate.FaucetRequest') }}</button>
          <b-message v-else :type="faucetMessageType">
            {{ faucetMessage }}
          </b-message>
        </b-field>
        <b-field :label="$t('ManageAccountActivate.Balance')">
          {{ balance }} MIX
        </b-field>
        <b-field :label="$t('ManageAccountActivate.PendingBalance')">
          {{ balancePending }} MIX
        </b-field>
      </template>
    </template>
  </page>
</template>

<script lang="ts">
  import Vue from 'vue'
  import Page from '../Page.vue'
  import QRCode from 'qrcode'
  import MixAccount from '../../../lib/MixAccount'
  import setTitle from '../../../lib/setTitle'

  export default Vue.extend({
    name: 'manage-account-activate',
    props: ['controllerAddress'],
    components: {
      Page,
    },
    data() {
      return {
        activating: false,
        qrcode: '',
        faucetRequested: false,
        faucetMessageType: '',
        faucetMessage: '',
        balance: '',
        balancePending: '',
      }
    },
    methods: {
      async update() {
        let balance = this.$mixClient.formatWei(await this.account.getControllerBalance())
        if (!this.activating && balance >= 0.01) {
          this.activating = true
          window.clearInterval(this.intervalId)
          await this.account.deploy()
          this.account.select()
          this.$router.push({ name: 'profile-edit' })
        }
        else {
          this.balance = balance
          this.balancePending = this.$mixClient.formatWei(await this.account.getUnconfirmedControllerBalance())
        }
      },
      async request() {
        try {
          let response = await this.$http.get('https://faucet.mix-blockchain.org:3001/' + this.controllerAddress)
          this.faucetMessageType = 'is-success'
          this.faucetMessage = response.data
          this.faucetRequested = true
        }
        catch (error) {
          this.faucetMessageType = 'is-danger'
          this.faucetMessage = error.response.data
          this.faucetRequested = true
        }
      },
    },
    async created() {
      setTitle(this.$t('ManageAccountActivate.DeployAccount'))
      this.account = await new MixAccount(this, this.controllerAddress).init()
      if (this.account.contractAddress != '') {
        this.$router.push({ name: 'profile-edit' })
      }
      else {
        let options: QRCode.QRCodeToDataURLOptions = {
          errorCorrectionLevel: 'H',
          scale: 1,
        }
        this.qrcode = await QRCode.toDataURL(this.controllerAddress, options)
        this.update()
        this.intervalId = window.setInterval(this.update, 500)
      }
    },
    destroyed() {
      window.clearInterval(this.intervalId)
    },
  })
</script>

<style scoped>
  .qr {
    image-rendering: pixelated;
    width: 256px;
    height: 256px;
    cursor: none;
    margin: 20px;
  }
  .captcha {
    margin-bottom: 15px;
  }
</style>
