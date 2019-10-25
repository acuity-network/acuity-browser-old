let itemStoreAbi = require('./contracts/MixItemStoreInterface.abi.json')
import ItemProto from './protobuf/Item_pb.js'
import MixRevision from './MixRevision'
import MixAccount from './MixAccount'

export default class MixItem {

  constructor(vue, itemId) {
    this.vue = vue
    this.itemId = itemId
  }

  init() {
    return new Promise(async (resolve, reject) => {
      try {
        this.itemStoreAddress = await this.vue.$mixClient.itemStoreRegistry.methods.getItemStore(this.itemId).call()
        this.itemStore = new this.vue.$mixClient.web3.eth.Contract(itemStoreAbi, this.itemStoreAddress)
        let inUse = await this.itemStore.methods.getInUse(this.itemId).call()
        if (!inUse) {
          reject('Item not found.')
          return
        }

        let contractId = await this.itemStore.methods.getContractId().call()
        if (contractId != "0xf1b5847865d2094d") {
          reject('Unknown item store.')
          return
        }

        this.item = await this.vue.$mixClient.itemStoreIpfsSha256.methods.getItem(this.itemId).call()
        this.revisions = []

        for (let i = 0; i < this.item.ipfsHashes.length; i++) {
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

  firstRevision() {
    return this.revisions[0]
  }

  latestRevision() {
    return this.revisions[this.item.ipfsHashes.length - 1]
  }

  get exists() {
  }

  get shortId() {
  }

  async isTrusted() {
    if (this.vue.$activeAccount.get().contractAddress == this.item.owner) {
      return true
    }
    let visibility
    try {
      visibility = await this.vue.$db.get('/accountVisibility/' + this.vue.$activeAccount.get().contractAddress + '/' + this.item.owner)
    }
    catch (e) {}

    switch (visibility) {
      case 'whitelist':
        return true;

      case 'blacklist':
        return false;
    }
    return await this.vue.$activeAccount.get().call(this.vue.$mixClient.trustedAccounts, 'getIsTrustedDeep', [this.item.owner])
  }

  async getTrustLevel() {
    if (this.vue.$activeAccount.get().contractAddress == this.item.owner) {
      return 1
    }
    if (await this.vue.$activeAccount.get().call(this.vue.$mixClient.trustedAccounts, 'getIsTrusted', [this.item.owner])) {
      return 2
    }
    if (await this.vue.$activeAccount.get().call(this.vue.$mixClient.trustedAccounts, 'getIsTrustedOnlyDeep', [this.item.owner])) {
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
        if (await this.vue.$activeAccount.get().call(this.vue.$mixClient.trustedAccounts, 'getIsTrustedOnlyDeep', [this.item.owner])) {
          return 3
        }
        return 0

      case 3:
        return 2
    }
  }
}
