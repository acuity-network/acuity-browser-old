<template>
  <img v-if="src" :src="src" crossorigin="anonymous">
</template>

<script lang="ts">
  import Vue from 'vue'
  export default Vue.extend({
    name: 'ipfs-image',
    props: ['ipfsHash'],
    data() {
      return {
        src: '',
      }
    },
    methods: {
      async loadData() {
        if (this.ipfsHash) {
          if (this.$isDesktop) {
            this.src = 'http://127.0.0.1:5102/ipfs/' + this.ipfsHash
          }
          else {
            let response = await this.$ipfsClient.get(this.ipfsHash)
            this.src = 'data:image/jpeg;base64,' + response.toString('base64')
          }
        }
      },
    },
    created() {
      this.loadData()
    },
    watch: {
      ipfsHash(val: string, oldVal: string) {
        this.src = ''
        this.loadData()
      },
    }
  })
</script>
