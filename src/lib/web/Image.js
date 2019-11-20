import ImageMixinProto from '../../lib/protobuf/ImageMixin_pb.js'
import bs58 from 'bs58'

export default class Image {

  constructor(vue, filepath) {
    this.vue = vue
    this.filepath = filepath
  }

  async createMixin() {
  }
}
