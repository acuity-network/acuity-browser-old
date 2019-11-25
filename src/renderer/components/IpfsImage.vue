<template>
  <img v-if="src" :src="src">
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
          let response = await this.$ipfsClient.get(this.ipfsHash)
          this.src = 'data:image/png;base64, ' + response.toString('base64')
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
