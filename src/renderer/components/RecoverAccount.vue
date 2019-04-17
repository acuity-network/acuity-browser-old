<template>
  <page>
    <template slot="title">
      Recover Account
    </template>

    <template slot="body">

      <div class="block">
        <b-radio v-model="recoveryType"
            native-value="phrase">
            Recovery Phrases
        </b-radio>
        <b-radio v-model="recoveryType"
            native-value="privateKey">
            Private Key
        </b-radio>
      </div>
      
      <div v-if="recoveryType == 'phrase'">
        <b-field label="Recovery Passphrase">
          <b-input id="phrase" autocomplete="off" inputmode="verbatim" placeholder="" spellcheck="false" size="66" style="font-family: monospace;"></b-input>
        </b-field>
        <code id="output" style="display: block; color:red; font-size:small"></code>
        <button class="button is-primary" v-on:click="submitPhrase">Submit</button>
      </div>

      <div v-else-if="recoveryType == 'privateKey'">
        <b-field label="Mix Private Key">
          <b-input id="pk" autocomplete="off" inputmode="verbatim" placeholder="" spellcheck="false" size="66" style="font-family: monospace;"></b-input>
        </b-field>
        <code id="output2" style="display: block; color:red; font-size:small"></code>
        <button class="button is-primary" v-on:click="submitPk">Submit</button>
      </div>

    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  let bip39 = require('bip39')
  let ethUtil = require('ethereumjs-util')

  export default {
    name: 'RecoverAccount',
    components: {
      Page,
    },
    data() {
      return {
        data: [],
        selected: {},
        recoveryType:"phrase"
      }
    },
    methods: {
        async submitPhrase() {
            const output = document.getElementById('output');
            output.innerHTML = '';
            const phrase = document.getElementById('phrase').value;

            if(phrase && bip39.validateMnemonic(phrase)) {
                let pk = bip39.mnemonicToSeedHex(phrase).substr(0, 64);
                let address = '0x' + ethUtil.privateToAddress(new Buffer.from(pk, 'hex')).toString('hex');
                let exist = await this.accountExist(address);
                if(exist){
                    output.innerHTML = 'This account has already been added.'
                } else {
                    this.addAccount(pk, address);
                    let notification = this.$notifications.accountRecovered(address)
                    new Notification(notification.title, notification)
                    this.$router.push({ name: 'manage-account-controller', params: { address: address } });
                }
            } else {
                output.innerHTML = 'Please enter a valid 12 word mnemonic phrase.'
            }

        },

        async submitPk() {
          const output = document.getElementById('output2');
          output.innerHTML = '';
          let pk = document.getElementById('pk').value;

          if(pk.substring(0,2) == '0x') {
            pk = pk.substring(2);
          }

          try{
            let address = '0x' + ethUtil.privateToAddress(new Buffer.from(pk, 'hex')).toString('hex');
            let exist = await this.accountExist(address);
            if(exist){
              output.innerHTML = 'This account has already been added.'
            } else {
              this.addAccount(pk, address);
              let notification = this.$notifications.accountRecovered(address)
              new Notification(notification.title, notification)
              this.$router.push({ name: 'manage-account-controller', params: { address: address } });
            }
          } catch(e) {
            output.innerHTML = 'Please enter a valid Mix private key.'
          }
        },

        async addAccount(pk, address) {
            this.$db.put('/account/controllerAddress/' + address, address)
            this.$db.put('/account/controller/' + address + '/privateKey', pk)
        },
        //true if account already exist in DB, false if not.
        async accountExist(address){
            try{
                let addressCheck = await this.$db.get('/account/controllerAddress/' + address);
                return true;
            } catch(err){
                return false;
            }
        }

    },
    created() {

    },
  }

</script>
