import { app } from 'electron'
import { remote } from 'electron'
import path from 'path'
import { spawn } from 'child_process'
import os from 'os'
import fs from 'fs'
import IpfsClient from './IpfsClient'

declare let __static: string

let ipfsProcess: any
let ipfsClient: any
let ipfsInterval: any

function connect() {
	let bootnodes = [
		'/ip4/172.104.175.158/tcp/4001/ipfs/QmQ38hetbvfJwhDXvXxyxT8reydNwPq6n9eXzEB11cwsji',
		'/ip6/2400:8901::f03c:91ff:fe46:1815/tcp/4001/ipfs/QmQ38hetbvfJwhDXvXxyxT8reydNwPq6n9eXzEB11cwsji',
		'/ip4/74.207.240.177/tcp/4001/ipfs/QmTdLvqQxAexuJAbSv8MnD3gK5DcscL15WWA8sYUH4vMvi',
		'/ip6/2600:3c01::f03c:91ff:fed5:2abf/tcp/4001/ipfs/QmTdLvqQxAexuJAbSv8MnD3gK5DcscL15WWA8sYUH4vMvi',
		'/ip4/45.79.128.151/tcp/4001/ipfs/QmXZBgSuTxKGsYmx6N1G8EEUWAm1tRXGuYadfxhgWetJf2',
		'/ip6/2600:3c03::f03c:91ff:fed5:2a82/tcp/4001/ipfs/QmXZBgSuTxKGsYmx6N1G8EEUWAm1tRXGuYadfxhgWetJf2',
		'/ip4/139.162.224.203/tcp/4001/ipfs/QmS6XPQKZSinqwFCsth7LxJeeH66ZiAgYxPphPCoWTiefq',
		'/ip6/2a01:7e00::f03c:91ff:fed5:2a94/tcp/4001/ipfs/QmS6XPQKZSinqwFCsth7LxJeeH66ZiAgYxPphPCoWTiefq',
		'/ip4/172.104.130.233/tcp/4001/ipfs/Qmar9pZaQPaMisc1x1LstphJV1jJiPrv21Edig93bz6oh8',
		'/ip6/2a01:7e01::f03c:91ff:fed5:2a00/tcp/4001/ipfs/Qmar9pZaQPaMisc1x1LstphJV1jJiPrv21Edig93bz6oh8',
		'/ip4/172.104.68.7/tcp/4001/ipfs/QmPe3zVKqnwPyBDf51zg6XkKTLz2tx4iW3DtCtK6ojm6er',
		'/ip6/2400:8902::f03c:91ff:fed5:2ac0/tcp/4001/ipfs/QmPe3zVKqnwPyBDf51zg6XkKTLz2tx4iW3DtCtK6ojm6er',
	]

	bootnodes.forEach(async bootnode => {
		try {
			await ipfsClient.get('swarm/connect?arg=' + bootnode)
		}
		catch (e) {}
	})
}

async function launch(window: any) {
	// Delete the API file that might have been left behind.
	try {
		fs.unlinkSync(path.join(app.getPath('userData'), 'ipfs', 'api'))
	} catch (e) {}
	let isWindows = os.platform() === 'win32'
	let commandPath = path.join(__static, 'go-ipfs', isWindows ? 'ipfs.exe' : 'ipfs')
	console.log('IPFS path: ' + commandPath)

	let options = {
		env: {
			'IPFS_PATH': path.join(app.getPath('userData'), 'ipfs'),
		}
	}

	let argss = [
		['init'],
		['bootstrap', 'add', '/ip4/172.104.175.158/tcp/4001/ipfs/QmQ38hetbvfJwhDXvXxyxT8reydNwPq6n9eXzEB11cwsji'],
		['bootstrap', 'add', '/ip6/2400:8901::f03c:91ff:fe46:1815/tcp/4001/ipfs/QmQ38hetbvfJwhDXvXxyxT8reydNwPq6n9eXzEB11cwsji'],
		['bootstrap', 'add', '/ip4/74.207.240.177/tcp/4001/ipfs/QmTdLvqQxAexuJAbSv8MnD3gK5DcscL15WWA8sYUH4vMvi'],
		['bootstrap', 'add', '/ip6/2600:3c01::f03c:91ff:fed5:2abf/tcp/4001/ipfs/QmTdLvqQxAexuJAbSv8MnD3gK5DcscL15WWA8sYUH4vMvi'],
		['bootstrap', 'add', '/ip4/173.255.195.214/tcp/4001/ipfs/QmZDy4rjTwvkkv4CRre87Z4ohr5JfMMSNwhbdcX21szCnn'],
		['bootstrap', 'add', '/ip6/2600:3c00::f03c:91ff:fed5:2aa3/tcp/4001/ipfs/QmZDy4rjTwvkkv4CRre87Z4ohr5JfMMSNwhbdcX21szCnn'],
		['bootstrap', 'add', '/ip4/50.116.38.52/tcp/4001/ipfs/QmcR25jursru6CEBWonPaqdLHAj5Ct9LLPu7Dk41dLPaxu'],
		['bootstrap', 'add', '/ip6/2600:3c02::f03c:91ff:fed5:2a0c/tcp/4001/ipfs/QmcR25jursru6CEBWonPaqdLHAj5Ct9LLPu7Dk41dLPaxu'],
		['bootstrap', 'add', '/ip4/45.79.128.151/tcp/4001/ipfs/QmXZBgSuTxKGsYmx6N1G8EEUWAm1tRXGuYadfxhgWetJf2'],
		['bootstrap', 'add', '/ip6/2600:3c03::f03c:91ff:fed5:2a82/tcp/4001/ipfs/QmXZBgSuTxKGsYmx6N1G8EEUWAm1tRXGuYadfxhgWetJf2'],
		['bootstrap', 'add', '/ip4/139.162.224.203/tcp/4001/ipfs/QmS6XPQKZSinqwFCsth7LxJeeH66ZiAgYxPphPCoWTiefq'],
		['bootstrap', 'add', '/ip6/2a01:7e00::f03c:91ff:fed5:2a94/tcp/4001/ipfs/QmS6XPQKZSinqwFCsth7LxJeeH66ZiAgYxPphPCoWTiefq'],
		['bootstrap', 'add', '/ip4/172.104.130.233/tcp/4001/ipfs/Qmar9pZaQPaMisc1x1LstphJV1jJiPrv21Edig93bz6oh8'],
		['bootstrap', 'add', '/ip6/2a01:7e01::f03c:91ff:fed5:2a00/tcp/4001/ipfs/Qmar9pZaQPaMisc1x1LstphJV1jJiPrv21Edig93bz6oh8'],
		['bootstrap', 'add', '/ip4/172.104.68.7/tcp/4001/ipfs/QmPe3zVKqnwPyBDf51zg6XkKTLz2tx4iW3DtCtK6ojm6er'],
		['bootstrap', 'add', '/ip6/2400:8902::f03c:91ff:fed5:2ac0/tcp/4001/ipfs/QmPe3zVKqnwPyBDf51zg6XkKTLz2tx4iW3DtCtK6ojm6er'],
		['bootstrap', 'add', '/ip4/172.105.16.240/tcp/4001/ipfs/Qmex27aG4LYeArEHBViQ52KN9coEwmwwsaRNKzTSbdBMSy'],
		['bootstrap', 'add', '/ip6/2600:3c04::f03c:91ff:fec3:c620/tcp/4001/ipfs/Qmex27aG4LYeArEHBViQ52KN9coEwmwwsaRNKzTSbdBMSy'],
		['config', '--json', 'Addresses.API', '"/ip4/127.0.0.1/tcp/5101"'],
		['config', '--json', 'Addresses.Gateway', '"/ip4/127.0.0.1/tcp/5102"'],
		['config', '--json', 'Addresses.Swarm', '["/ip4/0.0.0.0/tcp/0", "/ip6/::/tcp/0"]'],
		['config', '--json', 'Routing.Type', '"dhtclient"'],
		['config', '--json', 'Swarm.DisableBandwidthMetrics', 'true'],
		['config', '--json', 'Swarm.EnableAutoRelay', 'true'],
		['config', '--json', 'Experimental.QUIC', 'false'],
		['config', '--json', 'API.HTTPHeaders.Access-Control-Allow-Origin', '["*"]'],
		['config', '--json', 'API.HTTPHeaders.Access-Control-Allow-Methods', '["GET", "PUT", "POST", "DELETE"]'],
	]

	async function spawnIpfs(args: string[]) {
    return new Promise(async (resolve, reject) => {
			let process = spawn(commandPath, args, options)

			process.stdout.on('data', (data: any) => {
				console.log(data.toString())
			})

			process.stderr.on('data', (data: any) => {
				console.error(data.toString())
			})

			process.on('close', (code) => {
				resolve(code)
			})
		})
	}

	for (let args of argss) {
		await spawnIpfs(args)
	}

	ipfsProcess = spawn(commandPath, ['daemon'], options)

	ipfsProcess.stdout.on('data', (data: any) => {
		try {
			window.webContents.send('ipfs-stdout', data.toString())
		} catch (e) {}
	})

	ipfsProcess.stderr.on('data', (data: any) => {
		try {
			window.webContents.send('ipfs-stderr', data.toString())
		} catch (e) {}
	})

	ipfsClient = new IpfsClient()
	ipfsClient.init()
	ipfsInterval = setInterval(connect, 30000)
}

function kill() {
	if (ipfsProcess) {
    clearInterval(ipfsInterval)
    ipfsProcess.kill()
	}
}

function add(filepath: string) {
  return new Promise(async (resolve, reject) => {
    let isWindows = os.platform() === 'win32'
  	let commandPath = path.join(__static, 'go-ipfs', isWindows ? 'ipfs.exe' : 'ipfs')
    let options = {
  		env: {
  			'IPFS_PATH': path.join(remote.app.getPath('userData'), 'ipfs'),
  		}
  	}
    let args = ['add', '-Q', '--raw-leaves', filepath]
    let process = spawn(commandPath, args, options)

    process.stdout.on('data', (data: any) => {
      resolve(data.toString().trim())
  	})

    process.stderr.on('data', (data: any) => {
      reject(data.toString())
  	})
  })
}

export default { launch, kill, add }
