<template>
  <div>
    <video ref="video" @loadedmetadata="loadedmetadata" controls width="1024" height="768"></video>
    <b-field label="Resolution">
      <b-select v-model="ipfsHash" @input="input">
        <option v-for="resolution in resolutions" :value="resolution.ipfsHash">
          {{ resolution.width }} x {{ resolution.height }}
        </option>
      </b-select>
    </b-field>
  </div>
</template>

<script>
  import bs58 from 'bs58'
  import VideoStream from 'videostream'

  export default {
    name: 'video-view',
    props: [
      'message'
    ],
    data() {
      return {
        ipfsHash: null,
        resolutions: [],
        currentTime: null,
      }
    },
    created() {
      let encodingList = this.message.getEncodingList()

      for (let encoding of encodingList) {
        let ipfsHash = bs58.encode(Buffer.from(encoding.getIpfsHash()))
        this.resolutions.push({
          ipfsHash: ipfsHash,
          width: encoding.getWidth(),
          height: encoding.getHeight(),
        })
      }
    },
    mounted() {
      this.$refs.video.addEventListener('error', console.error)
    },
    methods: {
      startVideo() {
        this.$refs.video.removeEventListener('abort', this.startVideo)

        let ipfsHash = this.ipfsHash
        let ipfsClient = this.$ipfsClient

        this.videostream = new VideoStream({
          createReadStream (opts) {
            let { start, end } = opts
            let options = {offset: start}
            if (end > 0) {
              options.length = end - start + 1
            }
            return ipfsClient.getReadableStream(ipfsHash, options)
          }
        }, this.$refs.video)
      },
      input() {
        if (this.videostream) {
          this.$refs.video.pause()
          this.currentTime = this.$refs.video.currentTime
          // Special hack for Chrome.
          this.$refs.video.addEventListener('abort', this.startVideo)
          this.videostream.destroy()
          this.videostream = null
        }
        else {
          this.currentTime = 0
          this.startVideo()
        }
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
