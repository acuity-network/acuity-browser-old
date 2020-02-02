import ipfs from './Ipfs'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { remote } from 'electron'
import sub from 'subleveldown'
import lexint from 'lexicographic-integer-encoding'
import bs58 from 'bs58'
import MixItem from './MixItem'
import VideoMixinProto from './protobuf/VideoMixin_pb.js'

declare let __static: string

let vue: any
let transcoding: boolean = false
let stopping: boolean = false
let ffmpegProcess = null
let currentJobId
let deleting = false
let db

function init(_vue) {
  vue = _vue
  db = sub(vue.$db, 'transcoder', {
    keyEncoding: lexint('buffer', {strict: true}),
    valueEncoding: 'json',
  })

  db.createValueStream().on('data', job => {
    vue.$store.commit('transcodingsAdd', job)
    if (job.state == 'unpublished') {
      vue.$store.commit('transcodingsSetUnpublished', job.id)
    }
  })

  vue.$on('transcodeStart', async () => {
    if (transcoding) {
      console.log('Already transcoding.')
      return
    }
    vue.$store.commit('transcodingOn')
    transcoding = true
    while (true) {
      try {
        let job: any = await findJob()
        currentJobId = job.id
        try {
          await transcode(job)
        }
        catch (e) {}
        if (!transcoding) {
          return
        }
      }
      catch (e) {
        vue.$store.commit('transcodingOff')
        transcoding = false
        return
      }
    }
  })

  vue.$on('transcodeStop', async () => {
    stopping = true
    ffmpegProcess.kill()
  })

  vue.$on('transcodeRemoveJob', async (id: number) => {
    await db.del(id)
    vue.$store.commit('transcodingsRemove', id)
    if (id == currentJobId) {
      deleting = true
      ffmpegProcess.kill()
    }
  })

  vue.$on('accountUnlock', async account => {
    db.createValueStream().on('data', job => {
      if (job.state == 'unpublished' && job.accountAddress == account) {
        try {
          publishEncoding(job)
        }
        catch (e) {}
      }
    })
  })
}

function addJob(job) {
  return new Promise(async (resolve, reject) => {
    let id: number = 0
    db.createKeyStream({
      reverse: true,
      limit: 1,
    })
    .on('data', (key: number) => {
      id = key + 1
    })
    .on('end', () => {
      job.id = id
      db.put(id, job)
      vue.$store.commit('transcodingsAdd', job)
      resolve()
    })
  })
}

function findJob() {
  return new Promise(async (resolve, reject) => {
    let result = null
    db.createValueStream().on('data', job => {
      if (job.state == 'pending') {
        resolve(job)
      }
    })
    .on('end', () => {
      reject()
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
    args.push('aac')
  }
  args.push('-movflags')
  args.push('+faststart')
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
  args.push('mp4')

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
  args.push('-movflags')
  args.push('+faststart')
  args.push('-strict')
  args.push('-2')
  args.push('-y')

  return args
}

function ffmpeg(args, id, pass) {
  console.log(args)
  return new Promise((resolve, reject) => {
    let isWindows = os.platform() == 'win32'
    let commandPath = path.join(__static, 'ffmpeg', 'bin', isWindows ? 'ffmpeg.exe' : 'ffmpeg')

    ffmpegProcess = spawn(commandPath, args)
    ffmpegProcess.stdout.on('data', (data) => {
      console.log(data.toString())
    })

    ffmpegProcess.stderr.on('data', (data) => {
      let output = data.toString()
      try {
        let matches = output.match(/frame= *(\d*)/)
        let frame = parseInt(matches[1])
        vue.$store.commit('transcodingsSetProgress', {id: id, frame: frame, pass: pass})
      }
      catch (e) {}
      console.log(output)
    })

    ffmpegProcess.on('close', resolve)
  })
}

async function publishEncoding(job) {
  let item = await new MixItem(vue, job.itemId).init()
  let account = await item.account()
  let revision = await item.latestRevision().load()
  let videoMessage = VideoMixinProto.VideoMixin.deserializeBinary(revision.content.getPayloads('0x51108feb')[0])
  let encodingMessage = new VideoMixinProto.Encoding()
  encodingMessage.setFilesize(job.filesize)
  encodingMessage.setIpfsHash(bs58.decode(job.videoIpfsHash))
  encodingMessage.setWidth(job.width)
  encodingMessage.setHeight(job.height)
  videoMessage.addEncoding(encodingMessage)
  revision.content.removeMixins(0x51108feb)
  revision.content.addMixinPayload(0x51108feb, videoMessage.serializeBinary())
  let revisionIpfsHash = await revision.content.save()
  await account.sendData(vue.$mixClient.itemStoreIpfsSha256, 'createNewRevision', [job.itemId, revisionIpfsHash], 0, 'Add video encoding to item')
  db.del(job.id)
  vue.$store.commit('transcodingsRemove', job.id)
}

function transcode(job) {
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
        if (!stopping && code == 0) {
          args = vp9Pass2Args(job)
          args.push(outFilepath)
          code = await ffmpeg(args, job.id, 2)
        }
        break
    }

    if (deleting) {
      deleting = false
      resolve()
      return
    }

    if (stopping) {
      vue.$store.commit('transcodingOff')
      vue.$store.commit('transcodingsSetPending', job.id)
      stopping = false
      transcoding = false
      resolve()
      return
    }

    if (code == 0) {
      let stats = fs.statSync(outFilepath)
      job.filesize = stats.size
      job.videoIpfsHash = await ipfs.add(outFilepath)
      fs.unlinkSync(outFilepath)
      console.log(job.videoIpfsHash)

      try {
        await publishEncoding(job)
      }
      catch (e) {
        job.state = 'unpublished'
        let item = await new MixItem(vue, job.itemId).init()
        let account = await item.account()
        job.accountAddress = account.contractAddress
        db.put(job.id, job)
        vue.$store.commit('transcodingsSetUnpublished', job.id)
        reject()
        return
      }
      resolve()
    }
    else {
      db.del(job.id)
      vue.$store.commit('transcodingsFail', job.id)
      reject()
    }
  })
}

function kill() {
  if (transcoding) {
    stopping = true
    ffmpegProcess.kill()
  }
}

export default { init, kill, addJob }
