let TitleMixinProto: any = require('./protobuf/TitleMixin_pb.js')
let ImageMixinProto: any = require('./protobuf/ImageMixin_pb.js')
let BodyTextMixinProto: any = require('./protobuf/BodyTextMixin_pb.js')
let MixinSchemaMixinProto: any = require('./protobuf/MixinSchemaMixin_pb.js')
let ProfileMixinProto: any = require('./protobuf/ProfileMixin_pb.js')
let FileMixinProto: any = require('./protobuf/FileMixin_pb.js')
let VideoMixinProto: any = require('./protobuf/VideoMixin_pb.js')
import MixContent from './MixContent'
import bs58 from 'bs58'

export default class MixRevision {
  vue: any
  item: any
  revisionId: number
  content?: MixContent

  constructor(vue: any, item: any, revisionId: number) {
    this.vue = vue
    this.item = item
    this.revisionId = revisionId
  }

  async load() {
    this.content = new MixContent(this.vue)
    await this.content.load(this.item.item.ipfsHashes[this.revisionId])
    return this
  }

  getTimestamp() {
    return this.item.item.timestamps[this.revisionId]
  }

  getTitle() {
    return TitleMixinProto.TitleMixin.deserializeBinary(this.content!.getPayloads('0x344f4812')[0]).getTitle()
  }

  async getImageUrl(widthMin: number, heightMin: number) {
    let imageMessage = new ImageMixinProto.ImageMixin.deserializeBinary(this.content!.getPayloads('0x045eee8c')[0])
    let width = imageMessage.getWidth()
    let height = imageMessage.getHeight()
    let mipmapList = imageMessage.getMipmapLevelList()

    let i, scale
    for (i = 0; i < mipmapList.length; i++) {
      scale = 2 ** i
      if (width / scale < widthMin * 4 || height / scale < heightMin * 4) {
        break
      }
    }

    let response = await this.vue.$ipfsClient.get(bs58.encode(Buffer.from(mipmapList[i].getIpfsHash())))

    return 'data:image/jpeg;base64,' + response.toString('base64')
  }

  getImage(widthMin: number, heightMin: number) {
    let imageMessage = new ImageMixinProto.ImageMixin.deserializeBinary(this.content!.getPayloads('0x045eee8c')[0])
    let width = imageMessage.getWidth()
    let height = imageMessage.getHeight()
    let mipmapList = imageMessage.getMipmapLevelList()

    if (mipmapList.length == 0) {
      return ''
    }

    let i, scale
    for (i = 0; i < mipmapList.length; i++) {
      scale = 2 ** i
      if (width / scale < widthMin * 4 || height / scale < heightMin * 4) {
        break
      }
    }

    return bs58.encode(Buffer.from(mipmapList[i].getIpfsHash()))
  }

  getFile() {
    let fileMessage = FileMixinProto.FileMixin.deserializeBinary(this.content!.getPayloads('0x3c5bba9c')[0])
    return {
      name: fileMessage.getFilename(),
      size: fileMessage.getFilesize(),
      hash: bs58.encode(Buffer.from(fileMessage.getIpfsHash())),
    }
  }

  getVideo() {
    let videoMessage = VideoMixinProto.VideoMixin.deserializeBinary(this.content!.getPayloads('0x51108feb')[0])
    return videoMessage.toObject()
  }

  getBodyText() {
    return BodyTextMixinProto.BodyTextMixin.deserializeBinary(this.content!.getPayloads('0x2d382044')[0]).getBodyText()
  }

  getMixinSchema() {
    return MixinSchemaMixinProto.MixinSchemaMixin.deserializeBinary(this.content!.getPayloads('0xcdce4e5d')[0]).getMixinSchema()
  }

  getProfile() {
    let profileMessage = ProfileMixinProto.ProfileMixin.deserializeBinary(this.content!.getPayloads('0xbeef2144')[0])
    return {
      type: profileMessage.getType(),
      location: profileMessage.getLocation(),
    }
  }

}
