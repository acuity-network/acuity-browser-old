<template>
  <page>
    <template slot="title">
      {{ $t('Goto.GotoItem') }}
    </template>

    <template slot="body">
      <b-field label="itemId" :message="message">
        <b-input v-model.trim="encodedItemId" @keydown.native.enter="goto" autocomplete="off" inputmode="verbatim" spellcheck="false" size="44"></b-input>
      </b-field>

      <button class="button is-primary" @click="goto">{{ $t('Goto.Goto') }}</button>
    </template>
  </page>
</template>

<script lang="ts">
  import Page from './Page.vue'
  import MixItem from '../../lib/MixItem'
  import setTitle from '../../lib/setTitle'
  import clipboard from '../../lib/clipboard'
  import bs58 from 'bs58'

  export default {
    name: 'goto',
    components: {
      Page,
    },
    data() {
      return {
        encodedItemId: '',
        message: '',
      }
    },
    created() {
      setTitle(this.$t('Goto.GotoItem'))
      let clipboardText: string = clipboard.readText()

      try {
        bs58.decode(clipboardText)
        if (clipboardText.length == 33) {
          this.encodedItemId = clipboardText
        }
      }
      catch (e) {}
    },
    methods: {
      async goto(event) {
        let itemId: string = '0x' + bs58.decode(this.encodedItemId).toString('hex') + 'f1b5847865d2094d'
        try {
          await new MixItem(this.$root, itemId).init()
        }
        catch (e) {
          this.message = this.$t('Goto.ItemNotFound')
          return
        }

        this.$router.push({ name: 'item', params: { itemId: itemId }})
      }
    }
  }
</script>

<style scoped>
  div >>> input {
    font-family: 'Source Code Pro';
  }
</style>
