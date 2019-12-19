<template>
  <div>
    <b-field class="file">
      <b-upload v-model="file" v-on:input="input">
        <a class="button is-primary">
          <b-icon icon="upload"></b-icon>
          <span>{{ $t('VideoEdit.ChooseVideo') }}</span>
        </a>
      </b-upload>
      <span class="file-name" v-if="file">
        {{ file.name }}
      </span>
    </b-field>
    <div>Duration: {{ durationFormatted }}</div>
    <div>Frame rate: {{ frameRate }}</div>
    <div>Width: {{ width }}</div>
    <div>Height: {{ height }}</div>
  </div>
</template>

<script lang="ts">
  import VideoMixinProto from '../../../lib/protobuf/VideoMixin_pb.js'
  import bs58 from 'bs58'
  import child_process from 'child_process'
  import util from 'util'
  let exec = util.promisify(child_process.exec)
  import path from 'path'
  import os from 'os'
  import ipfs from '../../../lib/Ipfs'

  declare let __static: string

  export default {
    name: 'video-edit',
    props: {
      value: '',
		},
		data() {
      return {
        file: null,
        durationFormatted: null,
        frameRate: null,
        width: null,
        height: null,
      }
    },
		async created() {
		},
		methods: {
      async input() {
        if (this.file != null) {
          let isWindows = os.platform() == 'win32'
          let commandPath = path.join(__static, 'ffmpeg', 'bin', 'ffmpeg', isWindows ? '.exe' : '')
          try {
            await exec('"' + commandPath + '"' + ' -i "' + this.file.path + '"')
          }
          catch (e) {
            let matches = e.toString().match(/Duration: (\d*):(\d*):(\d*)\./)
            this.duration = (parseInt(matches[1]) * 60 + parseInt(matches[2])) * 60 + parseInt(matches[3])
            this.durationFormatted = new Date(1000 * this.duration).toISOString().substr(11, 8)
            matches = e.toString().match(/Video: .*, (\d*)x(\d*).*, ([0-9.]*) fps, /)
            this.width = parseInt(matches[1])
            this.height = parseInt(matches[2])
            this.frameRate = parseFloat(matches[3])
          }
        }
  		},
      async save() {
        this.ipfsHash = await ipfs.add(this.file.path)
        let videoMessage = new VideoMixinProto.VideoMixin()
        videoMessage.setFilename(this.file.name)
        videoMessage.setFilesize(this.file.size)
        videoMessage.setIpfsHash(bs58.decode(this.ipfsHash))
        videoMessage.setDuration(this.duration)
        return videoMessage.serializeBinary()
      },
      async postSave(itemId) {
        let supported_resolutions = [16, 20, 24, 28, 32, 40, 48, 64, 80, 120, 160, 192, 240, 320, 376, 480]
        let resolutions = []

        for (let b of supported_resolutions) {
          if (b * 9 <= this.height) {
            resolutions.push(b)
          }
          else {
            break
          }
        }

        let frameRates = [this.frameRate]

        let rate = this.frameRate
        while (rate >= 48) {
          rate /= 2
          frameRates.push(rate)
        }

        let id
        try {
          id = parseInt(await this.$db.get('/transcodeCount'))
        }
        catch (e) {
          id = 0
        }

        let batch = this.$db.batch()

        for (let b of resolutions) {
          let height = b * 9
          let width = (height * this.width) / this.height

          console.log(height, width)

          batch.put('/transcode/' + id, JSON.stringify({
            itemId: itemId,
            filepath: this.file.path,
            ipfsHash: this.ipfsHash,
            height: height,
            width: width,
          }))

          id++
        }

        await batch.put('/transcodeCount', id).write()
      },
    }
  }

</script>
