import Ipfs from 'ipfs'

let bootnodes = [
  '/dns4/singapore.mix-blockchain.org/tcp/4002/ws/ipfs/QmQ38hetbvfJwhDXvXxyxT8reydNwPq6n9eXzEB11cwsji',
  '/dns6/singapore.mix-blockchain.org/tcp/4002/ws/ipfs/QmQ38hetbvfJwhDXvXxyxT8reydNwPq6n9eXzEB11cwsji',
  '/dns4/freemont.mix-blockchain.org/tcp/4002/ws/ipfs/QmTdLvqQxAexuJAbSv8MnD3gK5DcscL15WWA8sYUH4vMvi',
  '/dns6/freemont.mix-blockchain.org/tcp/4002/ws/ipfs/QmTdLvqQxAexuJAbSv8MnD3gK5DcscL15WWA8sYUH4vMvi',
  '/dns4/dallas.mix-blockchain.org/tcp/4002/ws/ipfs/QmZDy4rjTwvkkv4CRre87Z4ohr5JfMMSNwhbdcX21szCnn',
  '/dns6/dallas.mix-blockchain.org/tcp/4002/ws/ipfs/QmZDy4rjTwvkkv4CRre87Z4ohr5JfMMSNwhbdcX21szCnn',
  '/dns4/atlanta.mix-blockchain.org/tcp/4002/ws/ipfs/QmcR25jursru6CEBWonPaqdLHAj5Ct9LLPu7Dk41dLPaxu',
  '/dns6/atlanta.mix-blockchain.org/tcp/4002/ws/ipfs/QmcR25jursru6CEBWonPaqdLHAj5Ct9LLPu7Dk41dLPaxu',
  '/dns4/newark.mix-blockchain.org/tcp/4002/ws/ipfs/QmXZBgSuTxKGsYmx6N1G8EEUWAm1tRXGuYadfxhgWetJf2',
  '/dns6/newark.mix-blockchain.org/tcp/4002/ws/ipfs/QmXZBgSuTxKGsYmx6N1G8EEUWAm1tRXGuYadfxhgWetJf2',
  '/dns4/london.mix-blockchain.org/tcp/4002/ws/ipfs/QmS6XPQKZSinqwFCsth7LxJeeH66ZiAgYxPphPCoWTiefq',
  '/dns6/london.mix-blockchain.org/tcp/4002/ws/ipfs/QmS6XPQKZSinqwFCsth7LxJeeH66ZiAgYxPphPCoWTiefq',
  '/dns4/frankfurt.mix-blockchain.org/tcp/4002/ws/ipfs/Qmar9pZaQPaMisc1x1LstphJV1jJiPrv21Edig93bz6oh8',
  '/dns6/frankfurt.mix-blockchain.org/tcp/4002/ws/ipfs/Qmar9pZaQPaMisc1x1LstphJV1jJiPrv21Edig93bz6oh8',
  '/dns4/tokyo.mix-blockchain.org/tcp/4002/ws/ipfs/QmPe3zVKqnwPyBDf51zg6XkKTLz2tx4iW3DtCtK6ojm6er',
  '/dns6/tokyo.mix-blockchain.org/tcp/4002/ws/ipfs/QmPe3zVKqnwPyBDf51zg6XkKTLz2tx4iW3DtCtK6ojm6er',
  '/dns4/toronto.mix-blockchain.org/tcp/4002/ws/ipfs/Qmex27aG4LYeArEHBViQ52KN9coEwmwwsaRNKzTSbdBMSy',
  '/dns6/toronto.mix-blockchain.org/tcp/4002/ws/ipfs/Qmex27aG4LYeArEHBViQ52KN9coEwmwwsaRNKzTSbdBMSy',
]


export default class IpfsClient {

  async init(vue) {
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

  async get(ipfsHash) {
    return await this.node.cat('/ipfs/' + ipfsHash)
  }

  async add(data) {
    let result = await this.node.add(data)
    return result[0].hash
  }

}
