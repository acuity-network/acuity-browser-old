<template>
  <page>
    <template slot="title">
      Goto
    </template>

    <template slot="body">
      <b-field label="itemId" :message="message">
        <b-input v-model="itemId" autocomplete="off" inputmode="verbatim" placeholder="0x0000000000000000000000000000000000000000000000000000000000000000" spellcheck="false" size="66" style="font-family: monospace;"></b-input>

      </b-field>

      <button class="button is-primary" v-on:click="goto">Goto</button>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import MixItem from '../../lib/MixItem.js'

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
    methods: {
      async goto(event) {
        try {
          let item = await new MixItem(this.$root, this.itemId).init()
        }
        catch (e) {
          this.message = 'Item not found.'
          return
        }

        this.$router.push({ name: 'item', params: { itemId: this.itemId }})
      }
    }
  }
</script>
