import { app } from 'electron'
import path from 'path'
import { spawn } from 'child_process'

let ipfsProcess

async function launch() {

	let os = require('os')
	let isWindows = os.platform() === 'win32'
	let appPath = app.getAppPath()
	let configPath

	if (process.env.NODE_ENV !== 'development') {
    appPath = path.join(appPath, '..', 'app.asar.unpacked')
		configPath = path.join(appPath, '..', 'extraResources', 'ipfs-config.json')
	}
	else {
		appPath = path.join(appPath, '..', '..', '..', '..', '..')
		configPath = path.join(appPath, 'src', 'extraResources', 'ipfs-config.json')
	}

	let commandPath = path.join(appPath, 'node_modules', 'go-ipfs-dep', 'go-ipfs', isWindows ? 'ipfs.exe' : 'ipfs')

	let args = [
      'init',
			'--empty-repo',
			configPath,
	]

	let options = {
		env: {
			'IPFS_PATH': path.join(app.getPath('userData'), '/ipfs'),
		}
	}

	ipfsProcess = spawn(commandPath, args, options)

	ipfsProcess.stdout.on('data', (data) => {
	  console.log(`stdout: ${data}`)
	})

	ipfsProcess.stderr.on('data', (data) => {
	  console.log(`stderr: ${data}`)
	})

	ipfsProcess.on('close', (code) => {
	  console.log(`child process exited with code ${code}`)

		let args = [
	      'daemon',
				'--routing=dhtclient',
		]

		ipfsProcess = spawn(commandPath, args, options)

		ipfsProcess.stdout.on('data', (data) => {
		  console.log(`stdout: ${data}`)
		})

		ipfsProcess.stderr.on('data', (data) => {
		  console.log(`stderr: ${data}`)
		})
	})
}

async function kill() {
	ipfsProcess.kill()
}

export default { launch, kill }
