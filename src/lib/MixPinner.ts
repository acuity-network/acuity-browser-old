import MixAccount from './MixAccount'
import MixContent from './MixContent'
import ImageMixinProto from './protobuf/ImageMixin_pb.js'
import FileMixinProto from './protobuf/FileMixin_pb.js'
import multihashes from 'multihashes'
import bs58 from 'bs58'

export default class MixPinner {
  vue: any
  accountsToWatch: any
  itemStoreIpfsSha256Emitter: any

  constructor(vue) {
    this.vue = vue
  }

  async pinIpfsHash(ipfsHash) {
    let encodedIpfsHash = multihashes.toB58String(multihashes.encode(Buffer.from(ipfsHash.substr(2), 'hex'), 'sha2-256'))
    // Wait for response before continuing to try to avoid DOSing IPFS daemon.
    await this.vue.$ipfsClient.get('pin/add?arg=' + encodedIpfsHash, false)

    let content = new MixContent(this.vue)
    await content.load(ipfsHash)
    // Pin images.
    let payloads = content.getPayloads('0x045eee8c')
    for (let payload of payloads) {
      let imageMessage = new ImageMixinProto.ImageMixin.deserializeBinary(payload)
      let mipmapList = imageMessage.getMipmapLevelList()

      for (let mipmap of mipmapList) {
        let encodedIpfsHash = bs58.encode(Buffer.from(mipmap.getIpfsHash()))
        // Wait for response before continuing to try to avoid DOSing IPFS daemon.
        await this.vue.$ipfsClient.get('pin/add?arg=' + encodedIpfsHash, false)
      }
    }
    // Pin files.
    let filePayloads = content.getPayloads('0x3c5bba9c')
    for (let payload of filePayloads) {
      let fileMessage = new FileMixinProto.FileMixin.deserializeBinary(payload)
      let encodedIpfsHash = bs58.encode(Buffer.from(fileMessage.getIpfsHash()))
      await this.vue.$ipfsClient.get('pin/add?arg=' + encodedIpfsHash, false)
    }
  }

  async start() {
    // Get a list of all accounts that should be watched.
    let localAccounts = await this.vue.$mixClient.web3.eth.personal.getAccounts()
    this.accountsToWatch = new Set()
    for (let controller of localAccounts) {
      try {
        let account = await new MixAccount(this.vue, controller).init()
        this.accountsToWatch.add(this.vue.$mixClient.web3.utils.padLeft(account.contractAddress, 64))
        let trustedList = await account.call(this.vue.$mixClient.trustedAccounts, 'getAllTrusted')
        for (let trusted of trustedList) {
          this.accountsToWatch.add(this.vue.$mixClient.web3.utils.padLeft(trusted, 64))
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
    let toBlock = await this.vue.$mixClient.web3.eth.getBlockNumber()

    // Find past events.
    let events = await this.vue.$mixClient.itemStoreIpfsSha256.getPastEvents('allEvents', {
      fromBlock: fromBlock,
      toBlock: toBlock,
      topics: ['0x0dbe5761780bd3332f4349220012aa42519557f909b3bfa059ada108fd6b6561',, Array.from(this.accountsToWatch)], // PublishRevision
    })

    // Pin IPFS files.
    for (let event of events) {
      await this.pinIpfsHash(event.returnValues.ipfsHash)
    }

    // Store where we got to.
    await this.vue.$db.put('/pinBlock', toBlock)

    // Start watching.
    this.itemStoreIpfsSha256Emitter = this.vue.$mixClient.itemStoreIpfsSha256.events.allEvents({
      fromBlock: toBlock + 1,
      toBlock: 'pending',
      topics: ['0x0dbe5761780bd3332f4349220012aa42519557f909b3bfa059ada108fd6b6561',, Array.from(this.accountsToWatch)], // PublishRevision
    })
    .on('data', async event => {
      await this.pinIpfsHash(event.returnValues.ipfsHash)
      // Store where we got to.
      this.vue.$db.put('/pinBlock', event.blockNumber)
    })
    .on('changed', log => {
    })
  }

  stop() {
    this.itemStoreIpfsSha256Emitter.unsubscribe()
  }

}
