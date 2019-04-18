import { app } from 'electron'
import path from 'path'
import { spawn } from 'child_process'
import os from 'os'

let ipfsProcess

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
			['bootstrap', 'rm', '--all'],
			['bootstrap', 'add', '/ip4/172.104.175.158/tcp/4001/ipfs/QmR45pTdezDqBP1v6BVFMt8ZvnJVTvzGGH18kosXhWaqBb'],
			['bootstrap', 'add', '/ip6/2400:8901::f03c:91ff:fe46:1815/tcp/4001/ipfs/QmR45pTdezDqBP1v6BVFMt8ZvnJVTvzGGH18kosXhWaqBb'],
			['bootstrap', 'add', '/ip4/74.207.240.177/tcp/4001/ipfs/QmU3MujEpxgLijf2ZgDFcQsGZ5NP5guBGC83HH7QUqAwt7'],
			['bootstrap', 'add', '/ip6/2600:3c01::f03c:91ff:fed5:2abf/tcp/4001/ipfs/QmU3MujEpxgLijf2ZgDFcQsGZ5NP5guBGC83HH7QUqAwt7'],
			['bootstrap', 'add', '/ip4/173.255.195.214/tcp/4001/ipfs/Qmf8VXhHcQgbjZUZZa9K5X9ZNocvhCk6SFhkquBiGARHiB'],
			['bootstrap', 'add', '/ip6/2600:3c00::f03c:91ff:fed5:2aa3/tcp/4001/ipfs/Qmf8VXhHcQgbjZUZZa9K5X9ZNocvhCk6SFhkquBiGARHiB'],
			['bootstrap', 'add', '/ip4/50.116.38.52/tcp/4001/ipfs/QmY6HQngZM6HqSzoajzcNYmGttpX8aMvmaZL6UsmVhAUS3'],
			['bootstrap', 'add', '/ip6/2600:3c02::f03c:91ff:fed5:2a0c/tcp/4001/ipfs/QmY6HQngZM6HqSzoajzcNYmGttpX8aMvmaZL6UsmVhAUS3'],
			['bootstrap', 'add', '/ip4/45.79.128.151/tcp/4001/ipfs/QmWx51XPWv23e23wazuE99WusCnnimrMYeqWAHhxLN3jVk'],
			['bootstrap', 'add', '/ip6/2600:3c03::f03c:91ff:fed5:2a82/tcp/4001/ipfs/QmWx51XPWv23e23wazuE99WusCnnimrMYeqWAHhxLN3jVk'],
			['bootstrap', 'add', '/ip4/139.162.224.203/tcp/4001/ipfs/QmTWExSozQCQCyrA5b22dbTqPEY4M9V7fqZcXefBeC6iGk'],
			['bootstrap', 'add', '/ip6/2a01:7e00::f03c:91ff:fed5:2a94/tcp/4001/ipfs/QmTWExSozQCQCyrA5b22dbTqPEY4M9V7fqZcXefBeC6iGk'],
			['bootstrap', 'add', '/ip4/172.104.130.233/tcp/4001/ipfs/QmNTWw4bd7YxHt96YzEYDAxmsJVcnRWDXrBPL7JjSNQ5nM'],
			['bootstrap', 'add', '/ip6/2a01:7e01::f03c:91ff:fed5:2a00/tcp/4001/ipfs/QmNTWw4bd7YxHt96YzEYDAxmsJVcnRWDXrBPL7JjSNQ5nM'],
			['bootstrap', 'add', '/ip4/172.104.68.7/tcp/4001/ipfs/QmW4KeWpE9NoZXDoDcYGgE6MoPuRGJFGUkf9RMe85pVdwm'],
			['bootstrap', 'add', '/ip6/2400:8902::f03c:91ff:fed5:2ac0/tcp/4001/ipfs/QmW4KeWpE9NoZXDoDcYGgE6MoPuRGJFGUkf9RMe85pVdwm'],
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

		resolve()
	})
}

function kill() {
	ipfsProcess.kill()
}

export default { launch, kill }
