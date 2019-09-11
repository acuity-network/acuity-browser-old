<template>
  <page>
    <template slot="title">
      Activate account
    </template>

    <template slot="body">
      <div v-if="!activating">
        <b-message type="is-info">
          <p>You need 0.01 MIX to get started. Either send MIX or use the faucet.</p>
        </b-message>
        <img class="qr" :src="qrcode" />
        <b-field label="Address">
          {{ controllerAddress }}
        </b-field>
        <b-field label="Faucet">
          <div v-if="!requesting">
            <vue-recaptcha class="captcha" sitekey="6Ld3npIUAAAAAN3xMe83rYHUy0wkgGXajOU6f9OM" @verify="onVerify" :loadRecaptchaScript="true"></vue-recaptcha>
            <button v-if="captchaComplete" class="button is-primary" @click="request">{{ $t('requestMix') }}</button>
          </div>
          <div v-if="requesting">
            {{ requestStatus}}
          </div>
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
  import setTitle from '../../lib/setTitle.js'
  import VueRecaptcha from 'vue-recaptcha'

  export default {
    name: 'manage-account-activate',
    props: ['controllerAddress'],
    components: {
      Page,
      VueRecaptcha,
    },
    data() {
      return {
        activating: false,
        qrcode: '',
        balance: '',
        balancePending: '',
        requestStatus: '',
        key: '',
        requesting: false,
        captchaComplete: false,
      }
    },
    methods: {
      async update() {
        let balance = this.$mixClient.web3.utils.fromWei(await this.account.getControllerBalance())
        if (!this.activating && balance >= 0.01) {
          this.activating = true
          window.clearInterval(this.intervalId)
          await this.account.deploy()
          this.account.select()
          this.$router.push({ name: 'profile-edit' })
        }
        else {
          this.balance = balance
          this.balancePending = this.$mixClient.web3.utils.fromWei(await this.account.getUnconfirmedControllerBalance())
        }
      },
      async request() {
        this.requesting = true
        this.requestStatus = 'Requesting...'
        let _toAddr = this.controllerAddress;
        this.$http.post("https://faucet.doubleplus.io/getMix", {
          toAddr: _toAddr,
          captcha: this.key,
        }).then(res => {
          if(res.status == 200) {
            this.requestStatus = 'Request Successful! TxHash: ' + res.data.txHash
          } else {
            this.requestStatus = 'Request Failed! ' + res.data.error
          }
        }).catch(err =>{
          this.requestStatus = 'Request Failed!'
        })
      },
      onVerify(response) {
        this.captchaComplete = true
        this.key = response
      },
    },
    async created() {
      setTitle('Activate account')
      this.account = await new MixAccount(this, this.controllerAddress).init()
      if ('contractAddress' in this.account) {
        this.$router.push({ name: 'profile' })
      }
      else {
        this.qrcode = await QRCode.toDataURL(this.controllerAddress, {
          mode: 'alphanumeric',
          errorCorrectionLevel: 'H',
          scale: 1,
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
