<template>
  <page>
    <template slot="title">
      {{ $t('Goto.GotoItem') }}
    </template>

    <template slot="body">
      <b-field label="itemId" :message="message">
        <b-input v-model.trim="itemId" @keydown.native.enter="goto" autocomplete="off" inputmode="verbatim" placeholder="0x0000000000000000000000000000000000000000000000000000000000000000" spellcheck="false" size="66" style="font-family: monospace;"></b-input>
      </b-field>

      <button class="button is-primary" @click="goto">{{ $t('Goto.Goto') }}</button>
    </template>
  </page>
</template>

<script lang="ts">
  import { clipboard } from 'electron'
  import Page from './Page.vue'
  import MixItem from '../../lib/MixItem.js'
  import setTitle from '../../lib/setTitle.js'

  export default {
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
      if (this.$mixClient.web3.utils.isHexStrict(clipboardText) && clipboardText.length == 66) {
        this.itemId = clipboardText
      }
    },
    methods: {
      async goto(event) {
        try {
          await new MixItem(this.$root, this.itemId).init()
        }
        catch (e) {
          this.message = this.$t('Goto.ItemNotFound')
          return
        }

        this.$router.push({ name: 'item', params: { itemId: this.itemId }})
      }
    }
  }
</script>
