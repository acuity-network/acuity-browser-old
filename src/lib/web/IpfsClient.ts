let Ipfs: any = require('ipfs')
let toStream: any = require('it-to-stream')

let bootnodes = [
  '/dns4/singapore.mix-blockchain.org/tcp/4003/wss/ipfs/QmQ38hetbvfJwhDXvXxyxT8reydNwPq6n9eXzEB11cwsji',
  '/dns6/singapore.mix-blockchain.org/tcp/4003/wss/ipfs/QmQ38hetbvfJwhDXvXxyxT8reydNwPq6n9eXzEB11cwsji',
  '/dns4/freemont.mix-blockchain.org/tcp/4003/wss/ipfs/QmTdLvqQxAexuJAbSv8MnD3gK5DcscL15WWA8sYUH4vMvi',
  '/dns6/freemont.mix-blockchain.org/tcp/4003/wss/ipfs/QmTdLvqQxAexuJAbSv8MnD3gK5DcscL15WWA8sYUH4vMvi',
  '/dns4/newark.mix-blockchain.org/tcp/4003/wss/ipfs/QmXZBgSuTxKGsYmx6N1G8EEUWAm1tRXGuYadfxhgWetJf2',
  '/dns6/newark.mix-blockchain.org/tcp/4003/wss/ipfs/QmXZBgSuTxKGsYmx6N1G8EEUWAm1tRXGuYadfxhgWetJf2',
  '/dns4/london.mix-blockchain.org/tcp/4003/wss/ipfs/QmS6XPQKZSinqwFCsth7LxJeeH66ZiAgYxPphPCoWTiefq',
  '/dns6/london.mix-blockchain.org/tcp/4003/wss/ipfs/QmS6XPQKZSinqwFCsth7LxJeeH66ZiAgYxPphPCoWTiefq',
  '/dns4/frankfurt.mix-blockchain.org/tcp/4003/wss/ipfs/Qmar9pZaQPaMisc1x1LstphJV1jJiPrv21Edig93bz6oh8',
  '/dns6/frankfurt.mix-blockchain.org/tcp/4003/wss/ipfs/Qmar9pZaQPaMisc1x1LstphJV1jJiPrv21Edig93bz6oh8',
  '/dns4/tokyo.mix-blockchain.org/tcp/4003/wss/ipfs/QmPe3zVKqnwPyBDf51zg6XkKTLz2tx4iW3DtCtK6ojm6er',
  '/dns6/tokyo.mix-blockchain.org/tcp/4003/wss/ipfs/QmPe3zVKqnwPyBDf51zg6XkKTLz2tx4iW3DtCtK6ojm6er',
]


export default class IpfsClient {
  node: any

  async init(vue: any) {
    let options = {
      relay: {
        enabled: true,
        hop: {
          enabled: true,
          active: true,
        }
      },
      config: {
        Addresses: {
          // This needs to be specified for production build.
          Swarm: [],
        },
        Bootstrap: bootnodes,
      },
    }
    this.node = await Ipfs.create(options)
    setInterval(this.connect.bind(this), 30000)
  }

  async connect() {
    for (let bootnode of bootnodes) {
  		try {
        await this.node.swarm.connect(bootnode)
  		}
  		catch (e) {
        console.error(e)
      }
  	}
  }

  id() {
    return this.node.id()
  }

  peers() {
    return this.node.swarm.peers()
  }

  repoStat() {
    return this.node.repo.stat()
  }

  async get(ipfsHash: string) {
    for await (let content of this.node.cat('/ipfs/' + ipfsHash)) {
      return content
    }
  }

  getReadableStream(ipfsHash: string, options: any) {
    return toStream.readable(this.node.cat('/ipfs/' + ipfsHash, options))
  }

  async add(data: any) {
    for await (let result of this.node.add(data)) {
      return result.path
    }
  }

}
