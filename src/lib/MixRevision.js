const multihashes = require('multihashes')
import itemProto from './item_pb.js'
import titleProto from './title_pb.js'
import jpegImageProto from './jpeg-image_pb.js'
import bodyTextProto from './body_pb.js'
import profileProto from './account-profile_pb.js'
const Base58 = require("base-58")

export default class MixRevision {

  constructor(vue, item, revisionId) {
    this.vue = vue
    this.item = item
    this.revisionId = revisionId
    this.mixins = []
  }

  load() {
    return new Promise((resolve, reject) => {

      const ipfsHash = multihashes.toB58String(multihashes.encode(Buffer.from(this.item.item.ipfsHashes[this.revisionId].substr(2), "hex"), 'sha2-256'))

      return this.vue.$http.get('http://127.0.0.1:5001/api/v0/cat?arg=/ipfs/' + ipfsHash)
      .then(response => {
        const containerPayload = new Uint8Array(Buffer.from(response.data, "binary"))
        const itemPayload = this.vue.$brotli.decompressArray(containerPayload)
        const itemMessage = itemProto.Item.deserializeBinary(itemPayload)
        const mixins = itemMessage.getMixinList()

        for (var i = 0; i < mixins.length; i++) {
          this.mixins.push({
            mixinId: '0x' + ('00000000' + mixins[i].getMixinId().toString(16)).slice(-8),
            mixinPayload: mixins[i].getPayload()
          })
        }

        resolve(this)
      })
    })
  }

  getTitle() {
    for (var i = 0; i < this.mixins.length; i++) {
      if (this.mixins[i].mixinId == '0x24da6114') {
        var titleMessage = titleProto.TitleMixin.deserializeBinary(this.mixins[i].mixinPayload)
        return titleMessage.getTitle()
      }
    }
  }

  getImage(widthOut) {
    for (var i = 0; i < this.mixins.length; i++) {
      if (this.mixins[i].mixinId == '0x12745469') {
        var imageMessage = new jpegImageProto.JpegMipmap.deserializeBinary(this.mixins[i].mixinPayload)
        var width = imageMessage.getWidth()
        var height = imageMessage.getHeight()
        var mipmapList = imageMessage.getMipmapLevelList()

        for (var i = 0; i < mipmapList.length; i++) {
          var scale = Math.pow(2, i)
          if (width / scale < widthOut * 4) {
            break
          }
        }

        var renderHeight = Math.round(widthOut * height / width)
        return '<img src="http://localhost:8081/ipfs/' + Base58.encode(mipmapList[i].getIpfsHash()) + '" width="' + widthOut + '" height="' + renderHeight + '">'
      }
    }
  }

  getBodyText() {
    for (var i = 0; i < this.mixins.length; i++) {
      if (this.mixins[i].mixinId == '0x34a9a6ec') {
        var bodyTextMessage = bodyTextProto.BodyTextMixin.deserializeBinary(this.mixins[i].mixinPayload)
        return bodyTextMessage.getBodyText()
      }
    }
  }

  getDescription() {
    for (var i = 0; i < this.mixins.length; i++) {
      if (this.mixins[i].mixinId == '0x5a474550') {
        var bodyTextMessage = bodyTextProto.BodyTextMixin.deserializeBinary(this.mixins[i].mixinPayload)
        return bodyTextMessage.getBodyText()
      }
    }
  }

  getProfile() {
    for (var i = 0; i < this.mixins.length; i++) {
      if (this.mixins[i].mixinId == '0x4bf3ce07') {
        var profileMessage = profileProto.AccountProfile.deserializeBinary(this.mixins[i].mixinPayload)
        return {
          type: profileMessage.getType(),
          location: profileMessage.getLocation(),
        }
      }
    }
  }

  mixinCount() {
  }

}
