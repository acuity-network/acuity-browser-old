<template>
  <div>
    <video v-if="src" :src="src" controls width="1024" height="768"></video>
    <b-field label="Resolution">
      <b-select v-model="src">
        <option
          v-for="resolution in resolutions"
          :value="resolution.url">
          {{ resolution.height }}
        </option>
      </b-select>
    </b-field>
  </div>
</template>

<script lang="ts">
  import bs58 from 'bs58'

  export default {
    name: 'video-view',
    props: [
      'message'
    ],
    components: {
    },
    data() {
      return {
        src: null,
        resolutions: [],
      }
    },
    async created() {
      let encodingList = this.message.getEncodingList()

      for (let encoding of encodingList) {
        let ipfsHash = bs58.encode(Buffer.from(encoding.getIpfsHash()))
        this.resolutions.push({
          url: 'http://127.0.0.1:5102/ipfs/' + ipfsHash,
          height: encoding.getHeight(),
        })
      }
    },
    destroyed() {
    },
		methods: {
		},
  }
</script>

<style scoped>
</style>
