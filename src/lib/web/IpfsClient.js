import Ipfs from 'ipfs'

let bootnodes = [
  '/ip4/172.104.175.158/tcp/4001/ipfs/QmQ38hetbvfJwhDXvXxyxT8reydNwPq6n9eXzEB11cwsji',
  '/ip6/2400:8901::f03c:91ff:fe46:1815/tcp/4001/ipfs/QmQ38hetbvfJwhDXvXxyxT8reydNwPq6n9eXzEB11cwsji',
  '/ip4/74.207.240.177/tcp/4001/ipfs/QmTdLvqQxAexuJAbSv8MnD3gK5DcscL15WWA8sYUH4vMvi',
  '/ip6/2600:3c01::f03c:91ff:fed5:2abf/tcp/4001/ipfs/QmTdLvqQxAexuJAbSv8MnD3gK5DcscL15WWA8sYUH4vMvi',
  '/ip4/173.255.195.214/tcp/4001/ipfs/QmZDy4rjTwvkkv4CRre87Z4ohr5JfMMSNwhbdcX21szCnn',
  '/ip6/2600:3c00::f03c:91ff:fed5:2aa3/tcp/4001/ipfs/QmZDy4rjTwvkkv4CRre87Z4ohr5JfMMSNwhbdcX21szCnn',
  '/ip4/50.116.38.52/tcp/4001/ipfs/QmcR25jursru6CEBWonPaqdLHAj5Ct9LLPu7Dk41dLPaxu',
  '/ip6/2600:3c02::f03c:91ff:fed5:2a0c/tcp/4001/ipfs/QmcR25jursru6CEBWonPaqdLHAj5Ct9LLPu7Dk41dLPaxu',
  '/ip4/45.79.128.151/tcp/4001/ipfs/QmXZBgSuTxKGsYmx6N1G8EEUWAm1tRXGuYadfxhgWetJf2',
  '/ip6/2600:3c03::f03c:91ff:fed5:2a82/tcp/4001/ipfs/QmXZBgSuTxKGsYmx6N1G8EEUWAm1tRXGuYadfxhgWetJf2',
  '/ip4/139.162.224.203/tcp/4001/ipfs/QmS6XPQKZSinqwFCsth7LxJeeH66ZiAgYxPphPCoWTiefq',
  '/ip6/2a01:7e00::f03c:91ff:fed5:2a94/tcp/4001/ipfs/QmS6XPQKZSinqwFCsth7LxJeeH66ZiAgYxPphPCoWTiefq',
  '/ip4/172.104.130.233/tcp/4001/ipfs/Qmar9pZaQPaMisc1x1LstphJV1jJiPrv21Edig93bz6oh8',
  '/ip6/2a01:7e01::f03c:91ff:fed5:2a00/tcp/4001/ipfs/Qmar9pZaQPaMisc1x1LstphJV1jJiPrv21Edig93bz6oh8',
  '/ip4/172.104.68.7/tcp/4001/ipfs/QmPe3zVKqnwPyBDf51zg6XkKTLz2tx4iW3DtCtK6ojm6er',
  '/ip6/2400:8902::f03c:91ff:fed5:2ac0/tcp/4001/ipfs/QmPe3zVKqnwPyBDf51zg6XkKTLz2tx4iW3DtCtK6ojm6er',
  '/ip4/172.105.16.240/tcp/4001/ipfs/Qmex27aG4LYeArEHBViQ52KN9coEwmwwsaRNKzTSbdBMSy',
  '/ip6/2600:3c04::f03c:91ff:fec3:c620/tcp/4001/ipfs/Qmex27aG4LYeArEHBViQ52KN9coEwmwwsaRNKzTSbdBMSy',
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
          Swarm: ["/ip4/0.0.0.0/tcp/0", "/ip6/::/tcp/0"],
        },
        Bootstrap: bootnodes,
      },
    }
    this.node = await Ipfs.create()
    setInterval(this.connect.bind(this), 30000)
  }

  async connect() {
    for (let bootnode of bootnodes) {
  		try {
        await this.node.swarm.connect(bootnode)
  		}
  		catch (e) {}
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
    let result = await this.node.add(Buffer.from(data, "binary"))
    console.log(result)
    return result[0]
  }

}
