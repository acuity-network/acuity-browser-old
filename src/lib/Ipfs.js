import { app } from 'electron'
import path from 'path'
import { spawn } from 'child_process'
import os from 'os'
import axios from 'axios'

let ipfsProcess
let ipfsInterval

function connect() {
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
	]

	bootnodes.forEach(async bootnode => {
		try {
			await axios.get('http://127.0.0.1:5001/api/v0/swarm/connect?arg=' + bootnode)
		}
		catch (e) {
			console.error('Failed to connect to boot node ' + bootnode)
		}
	})
}

function launch() {
	return new Promise(async (resolve, reject) => {
		let isWindows = os.platform() === 'win32'
		let appPath = app.getAppPath()

		if (process.env.NODE_ENV !== 'development') {
	    appPath = path.join(appPath, '..', 'app.asar.unpacked')
		}
		else {
			appPath = path.join(appPath, '..', '..', '..', '..', '..')
		}

		let commandPath = path.join(appPath, 'node_modules', 'go-ipfs-dep', 'go-ipfs', isWindows ? 'ipfs.exe' : 'ipfs')

		let options = {
			env: {
				'IPFS_PATH': path.join(app.getPath('userData'), 'ipfs'),
			}
		}

		let argss = [
			['init', '--empty-repo'],
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
			['config', '--json', 'Routing.Type', '"dhtclient"'],
			['config', '--json', 'Swarm.DisableBandwidthMetrics', 'true'],
			['config', '--json', 'Swarm.EnableAutoRelay', 'true'],
			['config', '--json', 'API.HTTPHeaders.Access-Control-Allow-Origin', '["*"]'],
			['config', '--json', 'API.HTTPHeaders.Access-Control-Allow-Methods', '["GET", "PUT", "POST", "DELETE"]'],
		]

		async function spawnIpfs(args) {
	    return new Promise(async (resolve, reject) => {
				let process = spawn(commandPath, args, options)

				process.stdout.on('data', (data) => {
					console.log(data.toString())
				})

				process.stderr.on('data', (data) => {
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

		ipfsProcess.stdout.on('data', (data) => {
			console.log(data.toString())
		})

		ipfsProcess.stderr.on('data', (data) => {
			console.error(data.toString())
		})

		ipfsInterval = setInterval(connect, 30000)

		resolve()
	})
}

function kill() {
	clearInterval(ipfsInterval)
	ipfsProcess.kill()
}

export default { launch, kill }
