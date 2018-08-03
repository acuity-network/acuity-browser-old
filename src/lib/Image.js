const sharp = require('sharp')
import jpegImageProto from './jpeg-image_pb.js'
const Base58 = require("base-58")
import itemProto from './item_pb.js'

export default class Image {

  constructor(vue, filepath) {
    this.vue = vue
    this.filepath = filepath
  }

  scaleImage(source, width, height) {
    return source
    .resize(width, height, {fastShrinkOnLoad: false})
    .webp()
    .toBuffer()
    .then(data => {
      var formData = new FormData()
      // See https://github.com/electron/electron/issues/11700
      formData.append('', new File([data.buffer.slice(0)], {type: 'application/octet-stream'}))
      return this.vue.$http.post('http://127.0.0.1:5001/api/v0/add', formData)
    })
  }

  createMixin() {
    var source = sharp(this.filepath)

    return source.metadata()
    .then(metadata => {
      var mipmaps = []
      var level = 1
      do {
        var scale = Math.pow(2, level)
        var width = Math.floor(metadata.width / scale)
        var height = Math.floor(metadata.height / scale)
        console.log(level, width, height)
        mipmaps.push(this.scaleImage(source, width, height))
        level++
      }
      while (width > 64 && height > 64)

      return Promise.all(mipmaps)
      .then(mipmaps => {
        var imageMessage = new jpegImageProto.JpegMipmap()
        imageMessage.setWidth(metadata.width)
        imageMessage.setHeight(metadata.height)
        mipmaps.forEach(mipmap => {
          var mipmapLevelMessage = new jpegImageProto.MipmapLevel()
          mipmapLevelMessage.setFilesize(mipmap.data.Size)
          mipmapLevelMessage.setIpfsHash(Base58.decode(mipmap.data.Hash))
          imageMessage.addMipmapLevel(mipmapLevelMessage)
        })

        var mixinMessage = new itemProto.Mixin()
        mixinMessage.setMixinId(0x12745469)
        mixinMessage.setPayload(imageMessage.serializeBinary())

        return mixinMessage
      })
    })
  }
}
