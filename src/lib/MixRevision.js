import multihashes from 'multihashes'
import titleProto from './protobuf/title_pb.js'
import jpegImageProto from './protobuf/jpeg-image_pb.js'
import bodyTextProto from './protobuf/body_pb.js'
import profileProto from './protobuf/account-profile_pb.js'
import MixContent from './MixContent.js'
import Base58 from 'base-58'

export default class MixRevision {

  constructor(vue, item, revisionId) {
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
    return titleProto.TitleMixin.deserializeBinary(this.content.getPayloads('0x24da6114')[0]).getTitle()
  }

  getImage(widthMin, heightMin) {
    let imageMessage = new jpegImageProto.JpegMipmap.deserializeBinary(this.content.getPayloads('0x12745469')[0])
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

    let widthOut = Math.round(width / scale)
    let heightOut = Math.round(height / scale)
    return '<img src="http://127.0.0.1:8080/ipfs/' + Base58.encode(mipmapList[i].getIpfsHash()) + '" width="' + widthOut + '" height="' + heightOut + '">'
  }

  getBodyText() {
    return bodyTextProto.BodyTextMixin.deserializeBinary(this.content.getPayloads('0x34a9a6ec')[0]).getBodyText()
  }

  getDescription() {
    return bodyTextProto.BodyTextMixin.deserializeBinary(this.content.getPayloads('0x5a474550')[0]).getBodyText()
  }

  getProfile() {
    let profileMessage = profileProto.AccountProfile.deserializeBinary(this.content.getPayloads('0x4bf3ce07')[0])
    return {
      type: profileMessage.getType(),
      location: profileMessage.getLocation(),
    }
  }

}
