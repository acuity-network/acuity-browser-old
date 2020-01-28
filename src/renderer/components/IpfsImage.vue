<template>
  <img v-if="src" :src="src" crossorigin="anonymous">
</template>

<script lang="ts">
  export default {
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
      ipfsHash(val, oldVal) {
        this.src = ''
        this.loadData()
      },
    }
  }
</script>
