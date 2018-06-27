const itemStoreRegistryAbi = require('./ItemStoreRegistry.abi.json')
const itemStoreShortIdAbi = require('./ItemStoreShortId.abi.json')
const itemStoreAbi = require('./ItemStoreInterface.abi.json')
import itemProto from '../item_pb.js'
import MixRevision from './mix_revision.js'

export default class MixItem {

  constructor(vue, itemId) {
    this.vue = vue
    this.itemId = itemId
  }

  init() {
    return new Promise((resolve, reject) => {

      this.itemStoreRegistry = new this.vue.$web3.eth.Contract(itemStoreRegistryAbi, '0xa46adddd3105715fa0ea0d4a883d4be99452c3f6')
      this.itemStoreShortId = new this.vue.$web3.eth.Contract(itemStoreShortIdAbi, '0xd02ee768718b41a8cea9350d7c4c443727da5c7b')

      return this.itemStoreRegistry.methods.getItemStore(this.itemId).call()
      .then(itemStoreAddress => {
        this.itemStoreAddress = itemStoreAddress
        this.itemStore = new this.vue.$web3.eth.Contract(itemStoreAbi, this.itemStoreAddress)
        return this.itemStore.methods.getInUse(this.itemId).call()
      })
      .then(inUse => {
        if (!inUse) {
          throw 'Item not found.'
        }
        else {
          return this.itemStore.methods.getContractId().call()
        }
      })
      .then(contractId => {
        if (contractId != "0x2d54bddf4be19c6c") {
          throw 'Unknown item store.'
        }

        return this.vue.$itemStoreIpfsSha256.methods.getItem(this.itemId).call()
        .then(item => {
          this.item = item
          this.revisions = []

          for (var i = 0; i < item.revisionCount; i++) {
            this.revisions.push(new MixRevision(this.vue, this, i))
          }

          resolve(this)
        })
      })
    })
  }

  itemId() {
    return this.itemId
  }

  revisions() {
    return this.revisions
  }

  latestRevision() {
    return this.revisions[this.item.revisionCount - 1]
  }

  get exists() {
  }

  get shortId() {
  }

}
