<template>
  <page>
    <template slot="title">
      New account
    </template>

    <template slot="body">
      <b-field label="Recovery phrase">
        {{ recoveryPhrase }}
      </b-field>

      <button class="button" @click="create">{{ $t('create') }}</button>
    </template>
  </page>
</template>

<script lang="ts">
  import Page from './Page.vue'
  import * as bip32 from 'bip32';
  import { BIP32Interface } from 'bip32';
  import * as bip39  from 'bip39'
  import * as ethUtil from 'ethereumjs-util'

  export default {
    name: 'manage-accounts-new',
    components: {
      Page,
    },
    data() {
      return {
        recoveryPhrase: '',
        privateKey: '',
        controllerAddress: '',
      }
    },
    methods: {
      create(event) {
        this.$db.put('/account/controllerAddress/' + this.controllerAddress, this.controllerAddress)
        this.$db.put('/account/controller/' + this.controllerAddress + '/privateKey', this.privateKey)
        this.$router.push({ name: 'manage-account-activate', params: { controllerAddress: this.controllerAddress } })
      },
    },
    async created() {
      this.recoveryPhrase = bip39.generateMnemonic()
      let node: BIP32Interface = bip32.fromSeed(await bip39.mnemonicToSeed(this.recoveryPhrase))
      let child: BIP32Interface = node.derivePath("m/44'/76'/0'/0/0");
      let privateKey: string = Buffer.from(child.privateKey)
      this.privateKey = '0x' + privateKey.toString('hex')
      this.controllerAddress = '0x' + ethUtil.privateToAddress(privateKey).toString('hex')
    },
  }
</script>
