import ipfs from './Ipfs'
import { spawn } from 'child_process'
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

  vue.$on('transcode', async () => {
    while(true) {
      try {
        let result: any = await findJob()
        await transcode(result.key, JSON.parse(result.value))
      }
      catch (e) {
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
      limit: 1
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

function transcode(key, job) {
  return new Promise(async (resolve, reject) => {
    console.log(job)

    let outFilepath = path.join(remote.app.getPath('userData'), 'output.mp4')

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
    args.push(outFilepath)

    console.log(args)

    let isWindows = os.platform() == 'win32'
    let commandPath = path.join(__static, 'ffmpeg', 'bin', 'ffmpeg', isWindows ? '.exe' : '')

    let process = spawn(commandPath, args)
    process.stdout.on('data', (data) => {
      console.log(data.toString())
    })

    process.stderr.on('data', (data) => {
      console.log(data.toString())
    })

    process.on('close', async (code) => {
      if (code == 0) {
        let ipfsHash = await ipfs.add(outFilepath)
        console.log(ipfsHash)

        let item = await new MixItem(vue, job.itemId).init()
        let revision = await item.latestRevision().load()
        let videoMessage = VideoMixinProto.VideoMixin.deserializeBinary(revision.content.getPayloads('0x51108feb')[0])
        let encodingMessage = new VideoMixinProto.Encoding()
  //      encodingMessage.setFilesize()
        encodingMessage.setIpfsHash(bs58.decode(ipfsHash))
        encodingMessage.setWidth(job.width)
        encodingMessage.setHeight(job.height)
        videoMessage.addEncoding(encodingMessage)
        revision.content.removeMixins(0x51108feb)
        revision.content.addMixinPayload(0x51108feb, videoMessage.serializeBinary())

        ipfsHash = await revision.content.save()
        await vue.$activeAccount.get().sendData(vue.$mixClient.itemStoreIpfsSha256, 'createNewRevision', [job.itemId, ipfsHash], 0, 'Add video encoding to item')
        vue.$db.del(key)
        vue.$store.commit('transcodingsRemove', job.id)
        resolve()
      }
      else {
        reject()
      }
    })
  })
}

export default { init }
