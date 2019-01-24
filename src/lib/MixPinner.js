import MixAccount from '../lib/MixAccount.js'
import MixItem from '../lib/MixItem.js'
let multihashes = require('multihashes')

export default class MixPinner {

  constructor(vue) {
    this.vue = vue
  }

  async pinItem(itemId) {
    let item = await new MixItem(this.vue, itemId).init()
    // Pin all the revisions.
    for (let ipfsHash of item.item.ipfsHashes) {
      let encodedIpfsHash = multihashes.toB58String(multihashes.encode(Buffer.from(ipfsHash.substr(2), "hex"), 'sha2-256'))
      let response = await this.vue.$http.get('http://127.0.0.1:5001/api/v0/pin/add?arg=' + encodedIpfsHash)
    }
  }

  async start() {
    // Get a list of all accounts that should be watched.
    let localAccounts = await this.vue.$web3.eth.personal.getAccounts()
    this.accountsToWatch = new Set()
    for (let controller of localAccounts) {
      try {
        let account = await new MixAccount(this.vue, controller).init()
        this.accountsToWatch.add(account.contractAddress)
        let trustedList = await account.call(this.vue.$trustedAccounts.methods.getAllTrusted())
        for (let trusted of trustedList) {
          this.accountsToWatch.add(trusted)
        }
      }
      catch (e) {}
    }

    // Start watching these profiles.
    this.vue.$itemStoreIpfsSha256.events.allEvents({
      fromBlock: 0,
      toBlock: 'pending',
      filter: {owner: this.accountsToWatch},
    })
    .on('data', log => {
      this.pinItem(log.returnValues.itemId)
    })
    .on('changed', log => {
      this.pinItem(log.returnValues.itemId)
    })
  }

}
