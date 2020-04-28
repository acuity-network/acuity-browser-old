<template>
  <div>
    <video :src="src" :poster="poster" ref="video" preload="auto" @loadedmetadata="loadedmetadata" controls width="1024" height="768" playsinline></video>
    <b-field label="Resolution">
      <b-select v-model="resolution" @input="input">
        <option v-for="resolution in resolutions" :value="resolution">
          {{ resolution.width }} x {{ resolution.height }}
        </option>
      </b-select>
    </b-field>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import bs58 from 'bs58'
  let detectBrowser: any = require('detect-browser')
  let VideoStream: any = require('videostream')

  export default Vue.extend({
    name: 'video-view',
    props: [
      'message',
      'posterIpfsHash',
    ],
    data() {
      return {
        resolution: null,
        src: null,
        poster: null,
        resolutions: [],
        currentTime: 0,
      }
    },
    created() {
      let browser = detectBrowser.detect()
      console.log(browser)
      this.useGateway = browser.name == 'safari' || browser.name == 'ios-webview'
      this.$ipfsClient.get(this.posterIpfsHash)
      .then((response: any) => {
        this.poster = 'data:image/jpeg;base64,' + response.toString('base64')
      })

      let encodingList = this.message.getEncodingList()
      let endpoint = this.$settings.get('mixEndpoint')
      for (let encoding of encodingList) {
        let ipfsHash = bs58.encode(Buffer.from(encoding.getIpfsHash()))
        this.resolutions.push({
          ipfsHash: ipfsHash,
          url: 'https://' + endpoint + '.mix-blockchain.org:8081/ipfs/' + ipfsHash,
          width: encoding.getWidth(),
          height: encoding.getHeight(),
        })
        this.resolution = this.resolutions[0]
      }
    },
    mounted() {
      this.$refs.video.addEventListener('error', console.error)

      if (this.useGateway) {
        this.src = this.resolutions[0].url
      }
      else {
        this.loadVideo()
      }
    },
    methods: {
      loadVideo() {
        this.$refs.video.removeEventListener('abort', this.loadVideo)

        let ipfsHash = this.resolution.ipfsHash
        let ipfsClient = this.$ipfsClient
        console.log(ipfsHash)
        console.log(ipfsClient)

        this.videostream = new VideoStream({
          createReadStream(opts: any) {
            console.log(opts)
            let { start, end } = opts
            let options: any = {offset: start}
            if (end > 0) {
              options.length = end - start + 1
            }
            return ipfsClient.getReadableStream(ipfsHash, options)
          }
        }, this.$refs.video)
      },
      input() {
        console.log('input')
        this.$refs.video.pause()
        this.currentTime = this.$refs.video.currentTime
        if (this.useGateway) {
          this.src = this.resolution.url
        }
        else {
          this.$refs.video.addEventListener('abort', this.loadVideo)
          this.videostream.destroy()
          this.videostream = null
        }
      },
      loadedmetadata() {
        console.log('loadedmetadata')
        this.$refs.video.currentTime = this.currentTime
        this.$refs.video.play()
      },
    },
  })
</script>

<style scoped>
</style>
