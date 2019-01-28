import MixAccount from '../lib/MixAccount.js'
import MixItem from '../lib/MixItem.js'
let multihashes = require('multihashes')

export default class MixPinner {

  constructor(vue) {
    this.vue = vue
  }

  async start() {
    // Get a list of all accounts that should be watched.
    let localAccounts = await this.vue.$web3.eth.personal.getAccounts()
    this.accountsToWatch = new Set()
    for (let controller of localAccounts) {
      try {
        let account = await new MixAccount(this.vue, controller).init()
        this.accountsToWatch.add(this.vue.$web3.utils.padLeft(account.contractAddress, 64))
        let trustedList = await account.call(this.vue.$trustedAccounts.methods.getAllTrusted())
        for (let trusted of trustedList) {
          this.accountsToWatch.add(this.vue.$web3.utils.padLeft(trusted, 64))
        }
      }
      catch (e) {}
    }

    // Determine start and end blocks to scan for events while Acuity was not running.
    let fromBlock = 0
    try {
      // Start 64 blocks in case there was a re-org.
      fromBlock = Math.max(await this.vue.$db.get('/pinBlock') - 64, 0)
    }
    catch (e) {}
    let toBlock = await this.vue.$web3.eth.getBlockNumber()


    // Find past events.
    let events = await this.vue.$itemStoreIpfsSha256.getPastEvents('allEvents', {
      fromBlock: fromBlock,
      toBlock: toBlock,
      topics: ['0x0dbe5761780bd3332f4349220012aa42519557f909b3bfa059ada108fd6b6561',, Array.from(this.accountsToWatch)], // PublishRevision
    })

    // Pin IPFS files.
    for (let event of events) {
      let encodedIpfsHash = multihashes.toB58String(multihashes.encode(Buffer.from(event.returnValues.ipfsHash.substr(2), "hex"), 'sha2-256'))
      console.log('Pinning ' + encodedIpfsHash)
      // Wait for response before continuing to try to avoid DOSing IPFS daemon.
      await this.vue.$http.get('http://127.0.0.1:5001/api/v0/pin/add?arg=' + encodedIpfsHash)
    }

    // Store where we got to.
    await this.vue.$db.put('/pinBlock', toBlock)

    // Start watching.
    this.vue.$itemStoreIpfsSha256.events.allEvents({
      fromBlock: toBlock,
      toBlock: 'pending',
      topics: ['0x0dbe5761780bd3332f4349220012aa42519557f909b3bfa059ada108fd6b6561',, Array.from(this.accountsToWatch)], // PublishRevision
    })
    .on('data', async log => {
      let encodedIpfsHash = multihashes.toB58String(multihashes.encode(Buffer.from(log.returnValues.ipfsHash.substr(2), "hex"), 'sha2-256'))
      // Wait for response before continuing to try to avoid DOSing IPFS daemon.
      await this.vue.$http.get('http://127.0.0.1:5001/api/v0/pin/add?arg=' + encodedIpfsHash)
      // Store where we got to.
      this.vue.$db.put('/pinBlock', log.blockNumber)
    })
    .on('changed', log => {
    })
  }

}
