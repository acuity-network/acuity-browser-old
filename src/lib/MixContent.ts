import multihashes from 'multihashes'
import brotli from './brotli'
import ItemProto from './protobuf/Item_pb.js'
let contentCache = []

export default class MixContent {
  vue: any
  mixins: any[]

  constructor(vue) {
    this.vue = vue
    this.mixins = []
  }

  async load(ipfsHash) {
    if (contentCache[ipfsHash]) {
      this.mixins = contentCache[ipfsHash]
      return this
    }

    let response

    try {
      let encodedIpfsHash = multihashes.toB58String(multihashes.encode(Buffer.from(ipfsHash.substr(2), 'hex'), 'sha2-256'))
      response = await this.vue.$ipfsClient.get(encodedIpfsHash)
    }
    catch (e) {
      return this
    }

    try {
      let itemPayload = Buffer.from(await brotli.decompress(Buffer.from(response.toString('utf8'), 'binary')))
      let mixins = ItemProto.Item.deserializeBinary(itemPayload).getMixinPayloadList()

      for (let i = 0; i < mixins.length; i++) {
        this.mixins.push({
          mixinId: '0x' + ('00000000' + mixins[i].getMixinId().toString(16)).slice(-8),
          payload: mixins[i].getPayload(),
        })
      }
    }
    catch (e) {
      console.log(e)
    }

    contentCache[ipfsHash] = this.mixins

    return this
  }

  async save() {
    let itemMessage = new ItemProto.Item()

    for (let i = 0; i < this.mixins.length; i++) {
      let mixinMessage = new ItemProto.MixinPayload()
      mixinMessage.setMixinId(this.mixins[i].mixinId)
      if (this.mixins[i].payload) {
        mixinMessage.setPayload(this.mixins[i].payload)
      }
      itemMessage.addMixinPayload(mixinMessage)
    }

    let payload = await brotli.compress(itemMessage.serializeBinary())
    let hash = await this.vue.$ipfsClient.add(Buffer.from(payload).toString('binary'), 'utf8')
    let decodedHash = multihashes.decode(multihashes.fromB58String(hash))

    if (decodedHash.name != 'sha2-256') {
      throw 'Wrong type of multihash.'
    }

    return '0x' + decodedHash.digest.toString('hex')
  }

  getMixins() {
    return this.mixins
  }

  getPayloads(mixinId) {
    let payloads = []
    for (let i = 0; i < this.mixins.length; i++) {
      if (this.mixins[i].mixinId == mixinId) {
        payloads.push(this.mixins[i].payload)
      }
    }
    return payloads
  }

  existMixin(mixinId) {
    for (let i = 0; i < this.mixins.length; i++) {
      if (this.mixins[i].mixinId == mixinId) {
        return true
      }
    }
    return false
  }

  addMixinPayload(mixinId, payload?) {
    this.mixins.push({
      mixinId: mixinId,
      payload: payload,
    })
  }

  removeMixins(mixinId) {
    let newMixins = []
    for (let i = 0; i < this.mixins.length; i++) {
      if (this.mixins[i].mixinId != mixinId) {
        newMixins.push(this.mixins[i])
      }
    }
    this.mixins = newMixins
  }

}
