let itemStoreAbi = require('./contracts/ItemStoreInterface.abi.json')
import itemProto from './protobuf/item_pb.js'
import MixRevision from './MixRevision.js'
import MixAccount from './MixAccount.js'

export default class MixItem {

  constructor(vue, itemId) {
    this.vue = vue
    this.itemId = itemId
  }

  init() {
    return new Promise(async (resolve, reject) => {
      try {
        this.itemStoreAddress = await this.vue.$itemStoreRegistry.methods.getItemStore(this.itemId).call()
        this.itemStore = new this.vue.$web3.eth.Contract(itemStoreAbi, this.itemStoreAddress)
        let inUse = await this.itemStore.methods.getInUse(this.itemId).call()
        if (!inUse) {
          reject('Item not found.')
          return
        }

        let contractId = await this.itemStore.methods.getContractId().call()
        if (contractId != "0x1f1e136d1003177d") {
          reject('Unknown item store.')
          return
        }

        this.item = await this.vue.$itemStoreIpfsSha256.methods.getItem(this.itemId).call()
        this.revisions = []

        for (let i = 0; i < this.item.revisionCount; i++) {
          this.revisions.push(new MixRevision(this.vue, this, i))
        }

        resolve(this)
      }
      catch (e) {
        reject(e)
      }
    })
  }

  account() {
    return new MixAccount(this.vue, this.item.owner, true).init()
  }

  itemId() {
    return this.itemId
  }

  isUpdatable() {
    return this.item.flags & 1
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

  async isTrusted() {
    if (window.activeAccount.contractAddress == this.item.owner) {
      return true
    }
    return await window.activeAccount.call(this.vue.$trustedAccounts, 'getIsTrustedDeep', [this.item.owner])
  }

  async getTrustLevel() {
    if (window.activeAccount.contractAddress == this.item.owner) {
      return 1
    }
    if (await window.activeAccount.call(this.vue.$trustedAccounts, 'getIsTrusted', [this.item.owner])) {
      return 2
    }
    if (await window.activeAccount.call(this.vue.$trustedAccounts, 'getIsTrustedOnlyDeep', [this.item.owner])) {
      return 3
    }
    return 0
  }

  async getTrustLevelToggled() {
    let level = await this.getTrustLevel()

    switch (level) {
      case 0:
        return 2

      case 1:
        return 1

      case 2:
        if (await window.activeAccount.call(this.vue.$trustedAccounts, 'getIsTrustedOnlyDeep', [this.item.owner])) {
          return 3
        }
        return 0

      case 3:
        return 2
    }
  }
}
