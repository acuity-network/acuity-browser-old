<template>
  <div>
    <video v-if="src" :src="src" :poster="poster" ref="video" preload="metadata" @loadedmetadata="loadedmetadata" controls width="1024" height="768"></video>
    <b-field label="Resolution">
      <b-select v-model="src" @input="input">
        <option
          v-for="resolution in resolutions"
          :value="resolution.url">
          {{ resolution.width }} x {{ resolution.height }}
        </option>
      </b-select>
    </b-field>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import bs58 from 'bs58'

  export default Vue.extend({
    name: 'video-view',
    props: [
      'message',
      'posterIpfsHash',
    ],
    components: {
    },
    data() {
      return {
        src: null,
        poster: null,
        resolutions: [],
        currentTime: 0,
      }
    },
    async created() {
      this.poster = 'http://127.0.0.1:5102/ipfs/' + this.posterIpfsHash
      let encodingList = this.message.getEncodingList()

      for (let encoding of encodingList) {
        let ipfsHash = bs58.encode(Buffer.from(encoding.getIpfsHash()))
        this.resolutions.push({
          url: 'http://127.0.0.1:5102/ipfs/' + ipfsHash,
          width: encoding.getWidth(),
          height: encoding.getHeight(),
        })
        this.src = this.resolutions[0].url
      }
    },
    destroyed() {
    },
		methods: {
      input() {
        this.$refs.video.pause()
        this.currentTime = this.$refs.video.currentTime
      },
      loadedmetadata() {
        this.$refs.video.currentTime = this.currentTime
        this.$refs.video.play()
      },
		},
  })
</script>

<style scoped>
</style>
