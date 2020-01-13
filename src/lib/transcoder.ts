import ipfs from './Ipfs'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { remote } from 'electron'
import MixItem from './MixItem'
import bs58 from 'bs58'
import VideoMixinProto from './protobuf/VideoMixin_pb.js'

declare let __static: string

let vue: any

function init(_vue) {
  vue = _vue

  vue.$db.createReadStream({
    'gt': '/transcode/',
    'lt': '/transcode/z',
  })
  .on('data', data => {
    vue.$store.commit('transcodingsAdd', JSON.parse(data.value))
  })

  let transcoding: boolean = false

  vue.$on('transcode', async () => {
    if (transcoding) {
      console.log('Already transcoding.')
      return
    }
    transcoding = true
    while (true) {
      try {
        let result: any = await findJob()
        try {
          await transcode(result.key, JSON.parse(result.value))
        }
        catch (e) {}
      }
      catch (e) {
        transcoding = false
        return
      }
    }
  })
}

function findJob() {
  return new Promise(async (resolve, reject) => {
    let result = null
    vue.$db.createReadStream({
      gt: '/transcode/',
      lt: '/transcode/z',
      limit: 1,
    })
    .on('data', data => {
      result = data
    })
    .on('end', () => {
      if (result) {
        resolve(result)
      }
      else {
        reject()
      }
    })
  })
}

function h264Args(job) {
  let args = []

  args.push('-i')
  args.push(job.filepath)
  args.push('-c:v')
  args.push('libx264')
  args.push('-crf')
  args.push(vue.$settings.get('h264.crf'))
  args.push('-preset')
  args.push(vue.$settings.get('h264.preset'))
  args.push('-vf')
  args.push('scale=' + job.width + ':' + job.height)
  args.push('-g')
  args.push('240')
  args.push('-c:a')
  if (job.audioPassthrough) {
    args.push('copy')
  }
  else {
    args.push('libopus')
  }
  args.push('-movflags')
  args.push('+faststart')
  args.push('-strict')
  args.push('-2')
  args.push('-y')

  return args
}

function vp9Args(job) {
  let args = []

  args.push('-i')
  args.push(job.filepath)
  args.push('-c:v')
  args.push('libvpx-vp9')
  args.push('-b:v')
  args.push('0')
  args.push('-crf')
  args.push(vue.$settings.get('vp9.crf'))
  args.push('-tile-columns')
  args.push('6')
  args.push('-frame-parallel')
  args.push('1')
  args.push('-vf')
  args.push('scale=' + job.width + ':' + job.height)
  args.push('-g')
  args.push('240')
  args.push('-f')
  args.push('matroska')

  return args
}

function vp9Pass1Args(job) {
  let args = vp9Args(job)

  args.push('-cpu-used')
  args.push('4')
  args.push('-pass')
  args.push('1')
  args.push('-an')
  args.push('-y')

  if (os.platform() == 'win32') {
    args.push('NUL')
  }
  else {
    args.push('/dev/null')
  }

  return args
}

function vp9Pass2Args(job) {
  let args = vp9Args(job)

  args.push('-cpu-used')
  args.push(vue.$settings.get('vp9.speed'))
  args.push('-row-mt')
  args.push('1')
  args.push('-auto-alt-ref')
  args.push('1')
  args.push('-lag-in-frames')
  args.push('25')
  args.push('-pass')
  args.push('2')
  args.push('-c:a')
  if (job.audioPassthrough) {
    args.push('copy')
  }
  else {
    args.push('libopus')
  }
  args.push('-y')

  return args
}

function ffmpeg(args, id, pass) {
  console.log(args)
  return new Promise((resolve, reject) => {
    let isWindows = os.platform() == 'win32'
    let commandPath = path.join(__static, 'ffmpeg', 'bin', 'ffmpeg', isWindows ? '.exe' : '')

    let process = spawn(commandPath, args)
    process.stdout.on('data', (data) => {
      console.log(data.toString())
    })

    process.stderr.on('data', (data) => {
      let output = data.toString()
      try {
        let matches = output.match(/frame= *(\d*)/)
        let frame = parseInt(matches[1])
        vue.$store.commit('transcodingsSetProgress', {id: id, frame: frame, pass: pass})
      }
      catch (e) {}
      console.log(output)
    })

    process.on('close', resolve)
  })
}

function transcode(key, job) {
  return new Promise(async (resolve, reject) => {
    console.log(job)

    let outFilepath = path.join(remote.app.getPath('userData'), 'output.mp4')
    let code
    let args

    switch (job.codec) {
      case 'h264':
        args = h264Args(job)
        args.push(outFilepath)
        code = await ffmpeg(args, job.id, 0)
        break

      case 'vp9':
        args = vp9Pass1Args(job)
        code = await ffmpeg(args, job.id, 1)
        if (code == 0) {
          args = vp9Pass2Args(job)
          args.push(outFilepath)
          code = await ffmpeg(args, job.id, 2)
        }
        break
    }

    if (code == 0) {
      let stats = fs.statSync(outFilepath)
      let ipfsHash = await ipfs.add(outFilepath)
      fs.unlinkSync(outFilepath)
      console.log(ipfsHash)

      let item = await new MixItem(vue, job.itemId).init()
      let revision = await item.latestRevision().load()
      let videoMessage = VideoMixinProto.VideoMixin.deserializeBinary(revision.content.getPayloads('0x51108feb')[0])
      let encodingMessage = new VideoMixinProto.Encoding()
      encodingMessage.setFilesize(stats.size)
      encodingMessage.setIpfsHash(bs58.decode(ipfsHash))
      encodingMessage.setWidth(job.width)
      encodingMessage.setHeight(job.height)
      videoMessage.addEncoding(encodingMessage)
      revision.content.removeMixins(0x51108feb)
      revision.content.addMixinPayload(0x51108feb, videoMessage.serializeBinary())

      ipfsHash = await revision.content.save()
      await await vue.$activeAccount.get().sendData(vue.$mixClient.itemStoreIpfsSha256, 'createNewRevision', [job.itemId, ipfsHash], 0, 'Add video encoding to item')
      vue.$db.del(key)
      vue.$store.commit('transcodingsRemove', job.id)
      resolve()
    }
    else {
      vue.$db.del(key)
      vue.$store.commit('transcodingsFail', job.id)
      reject()
    }
  })
}

export default { init }
