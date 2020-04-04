<template>
  <page>
    <template slot="title">
      {{ $t('Goto.GotoItem') }}
    </template>

    <template slot="body">
      <b-field label="itemId" :message="message">
        <b-input v-model.trim="itemId" @keydown.native.enter="goto" autocomplete="off" inputmode="verbatim" spellcheck="false" size="66"></b-input>
      </b-field>

      <button class="button is-primary" @click="goto">{{ $t('Goto.Goto') }}</button>
    </template>
  </page>
</template>

<script lang="ts">
  import Vue from 'vue'
  import Page from '../Page.vue'
  import MixItem from '../../../lib/MixItem'
  import setTitle from '../../../lib/setTitle'
  import clipboard from '../../../lib/clipboard'
  import bs58 from 'bs58'

  export default Vue.extend({
    name: 'goto',
    components: {
      Page,
    },
    data() {
      return {
        itemId: '',
        message: '',
      }
    },
    created() {
      setTitle(this.$t('Goto.GotoItem'))
      let clipboardText: string = clipboard.readText()

      try {
        bs58.decode(clipboardText)
        switch (clipboardText.length) {
          case 32:
          case 33:
            this.itemId = clipboardText
        }
      }
      catch (e) {
        if (this.$mixClient.web3.utils.isHexStrict(clipboardText) && clipboardText.length == 66) {
          this.itemId = clipboardText
        }
      }
    },
    methods: {
      async goto(event: any) {
        let encodedItemId: string
        try {
          let itemId: string
          if (this.$mixClient.web3.utils.isHexStrict(this.itemId) && this.itemId.length == 66) {
            itemId = this.itemId
            encodedItemId = bs58.encode(Buffer.from(this.$mixClient.web3.utils.hexToBytes(itemId.substr(0, 50))))
          }
          else {
            itemId = '0x' + bs58.decode(this.itemId).toString('hex') + 'f1b5847865d2094d'
            encodedItemId = this.itemId
          }
          await new MixItem(this.$root, itemId).init()
        }
        catch (e) {
          this.message = this.$t('Goto.ItemNotFound')
          return
        }
        this.$router.push({ name: 'item', params: { encodedItemId: encodedItemId }})
      }
    }
  })
</script>

<style scoped>
  div >>> input {
    font-family: 'Source Code Pro';
  }
</style>
