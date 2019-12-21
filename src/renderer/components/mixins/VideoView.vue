<template>
  <div>
    <video v-if="src" :src="src" ref="video" @loadedmetadata="loadedmetadata" controls width="1024" height="768"></video>
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
        currentTime: null,
      }
    },
    async created() {
      let encodingList = this.message.getEncodingList()

      for (let encoding of encodingList) {
        let ipfsHash = bs58.encode(Buffer.from(encoding.getIpfsHash()))
        this.resolutions.push({
          url: 'http://127.0.0.1:5102/ipfs/' + ipfsHash,
          width: encoding.getWidth(),
          height: encoding.getHeight(),
        })
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
  }
</script>

<style scoped>
</style>
