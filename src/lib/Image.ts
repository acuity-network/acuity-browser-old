import sharp from 'sharp'
import bs58 from 'bs58'
let ImageMixinProto  = require('./protobuf/ImageMixin_pb.js')

export default class Image {
  vue: any
  filepath: string

  constructor(vue: any, file: any) {
    this.vue = vue
    this.filepath = file.path
  }

  async createMixin() {
    // Use SIMD instructions if available.
    sharp.simd(true)
    let source: any = sharp(this.filepath)
      .rotate()             // Rotate/flip the image if specified in EXIF.

    let metadata: any = await source.metadata()
    // Work out correct dimensions if rotation occured.
    let width: number, height: number
    if (metadata.orientation > 4) {
      width = metadata.height
      height = metadata.width
    }
    else {
      width = metadata.width
      height = metadata.height
    }
    let mipmaps: Promise<any>[] = []
    // Don't resize the top-level mipmap.
    mipmaps.push(source
      .clone()
      .jpeg()
      .toBuffer()
      .then(async (data: any) => {
        return {
          filesize: data.length,
          ipfsHash: await this.vue.$ipfsClient.add(data)
        }
      })
    )

    let level = 1, outWidth, outHeight
    do {
      let scale: number = 2 ** level
      outWidth = Math.round(width / scale)
      outHeight = Math.round(height / scale)
      mipmaps.push(source
        .clone()
        .resize(outWidth, outHeight, {fit: 'fill', fastShrinkOnLoad: false})
        .jpeg()
        .toBuffer()
        .then(async (data: any) => {
          return {
            filesize: data.length,
            ipfsHash: await this.vue.$ipfsClient.add(data)
          }
        })
      )
      level++
    }
    while (outWidth > 64 && outHeight > 64)

    let imageMessage = new ImageMixinProto.ImageMixin()
    imageMessage.setWidth(width)
    imageMessage.setHeight(height)
    for (let mipmap of await Promise.all(mipmaps)) {
      let mipmapLevelMessage = new ImageMixinProto.MipmapLevel()
      mipmapLevelMessage.setFilesize(mipmap.filesize)
      mipmapLevelMessage.setIpfsHash(bs58.decode(mipmap.ipfsHash))
      imageMessage.addMipmapLevel(mipmapLevelMessage)
    }

    return imageMessage.serializeBinary()
  }
}
