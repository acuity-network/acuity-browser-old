import sharp from 'sharp'
import ImageMixinProto from './protobuf/ImageMixin_pb.js'
import bs58 from 'bs58'

export default class Image {

  constructor(vue, filepath) {
    this.vue = vue
    this.filepath = filepath
  }

  async createMixin() {
    // Use SIMD instructions if available.
    sharp.simd(true)
    let source = sharp(this.filepath)
      .rotate()             // Rotate/flip the image if specified in EXIF.

    let metadata = await source.metadata()
    // Work out correct dimensions if rotation occured.
    let width, height
    if (metadata.orientation > 4) {
      width = metadata.height
      height = metadata.width
    }
    else {
      width = metadata.width
      height = metadata.height
    }
    let mipmaps = []
    // Don't resize the top-level mipmap.
    mipmaps.push(source
      .clone()
      .webp()
      .toBuffer()
      .then(data => {
        let formData = new FormData()
        // See https://github.com/electron/electron/issues/11700
        formData.append('', new File([data.buffer.slice(0)], {type: 'application/octet-stream'}))
        return this.vue.$http.post('http://127.0.0.1:5101/api/v0/add', formData)
      })
    )

    let level = 1, outWidth, outHeight
    do {
      let scale = 2 ** level
      outWidth = Math.round(width / scale)
      outHeight = Math.round(height / scale)
      mipmaps.push(source
        .clone()
        .resize(outWidth, outHeight, {fit: 'fill', fastShrinkOnLoad: false})
        .webp()
        .toBuffer()
        .then(data => {
          let formData = new FormData()
          // See https://github.com/electron/electron/issues/11700
          formData.append('', new File([data.buffer.slice(0)], {type: 'application/octet-stream'}))
          return this.vue.$http.post('http://127.0.0.1:5101/api/v0/add', formData)
        })
      )
      level++
    }
    while (outWidth > 64 && outHeight > 64)

    mipmaps = await Promise.all(mipmaps)
    let imageMessage = new ImageMixinProto.ImageMixin()
    imageMessage.setWidth(width)
    imageMessage.setHeight(height)
    mipmaps.forEach(mipmap => {
      let mipmapLevelMessage = new ImageMixinProto.MipmapLevel()
      mipmapLevelMessage.setFilesize(mipmap.data.Size)
      mipmapLevelMessage.setIpfsHash(bs58.decode(mipmap.data.Hash))
      imageMessage.addMipmapLevel(mipmapLevelMessage)
    })

    return imageMessage.serializeBinary()
  }
}
