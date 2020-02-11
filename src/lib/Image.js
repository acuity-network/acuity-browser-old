import sharp from 'sharp'
import ImageMixinProto from './protobuf/ImageMixin_pb.js'
import bs58 from 'bs58'

export default class Image {

  constructor(vue, file) {
    this.vue = vue
    this.filepath = file.path
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
      .jpeg()
      .toBuffer()
      .then(async data => {
        return {
          filesize: data.length,
          ipfsHash: await this.vue.$ipfsClient.add(data)
        }
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
        .jpeg()
        .toBuffer()
        .then(async data => {
          return {
            filesize: data.length,
            ipfsHash: await this.vue.$ipfsClient.add(data)
          }
        })
      )
      level++
    }
    while (outWidth > 64 && outHeight > 64)

    mipmaps = await Promise.all(mipmaps)
    let imageMessage = new ImageMixinProto.ImageMixin()
    imageMessage.setWidth(width)
    imageMessage.setHeight(height)
    for (let mipmap of mipmaps) {
      let mipmapLevelMessage = new ImageMixinProto.MipmapLevel()
      mipmapLevelMessage.setFilesize(mipmap.filesize)
      mipmapLevelMessage.setIpfsHash(bs58.decode(mipmap.ipfsHash))
      imageMessage.addMipmapLevel(mipmapLevelMessage)
    }

    return imageMessage.serializeBinary()
  }
}
