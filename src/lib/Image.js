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
    sharp.simd(true)
    var source = sharp(this.filepath).rotate()

    return source.metadata()
    .then(metadata => {
      var width, height
      if (metadata.orientation > 4) {
        width = metadata.height
        height = metadata.width
      }
      else {
        width = metadata.width
        height = metadata.height
      }
      var mipmaps = []
      var level = 0
      do {
        var scale = Math.pow(2, level)
        var outWidth = Math.floor(width / scale)
        var outHeight = Math.floor(height / scale)
        console.log(level, outWidth, outHeight)
        mipmaps.push(this.scaleImage(source, outWidth, outHeight))
        level++
      }
      while (outWidth > 64 && outHeight > 64)

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
