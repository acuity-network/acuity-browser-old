const fs = require('fs')
const jpeg = require('jpeg-js')
const pica = require('pica')()
import axios from 'axios'
import jpegImageProto from '../jpeg-image_pb.js'
const Base58 = require("base-58")
import itemProto from '../item_pb.js'

export default class Image {

  constructor(filepath) {
    this.filepath = filepath
  }

  scaleImage(rawImageData, width, height) {
    return pica.resizeBuffer({
      src: rawImageData.data,
      width: rawImageData.width,
      height: rawImageData.height,
      toWidth: width,
      toHeight: height
    }).then(result => {
      rawImageData = {
        data: result,
        width: width,
        height: height
      }
      var jpegImageData = jpeg.encode(rawImageData, 70)

      var data = new FormData()
      data.append('', new File([jpegImageData.data], {type: 'application/octet-stream'}))

      return axios.post('http://127.0.0.1:5001/api/v0/add', data)
    })
  }

  createMixin() {
    var jpegData = fs.readFileSync(this.filepath)
    var rawImageData = jpeg.decode(jpegData)

    var mipmaps = []
    var level = 1
    do {
      var scale = Math.pow(2, level)
      var width = Math.floor(rawImageData.width / scale)
      var height = Math.floor(rawImageData.height / scale)
      console.log(level, width, height)
      mipmaps.push(this.scaleImage(rawImageData, width, height))
      level++
    }
    while (width > 64 && height > 64)

    return Promise.all(mipmaps).then(mipmaps => {
      var imageMessage = new jpegImageProto.JpegMipmap()
      imageMessage.setWidth(rawImageData.width)
      imageMessage.setHeight(rawImageData.height)
      mipmaps.forEach(function(mipmap) {
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
  }
}
