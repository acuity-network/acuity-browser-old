import { app } from 'electron'
import path from 'path'
import { spawn } from 'child_process'

export default async function launchIpfs() {

	let os = require('os')
	let isWindows = os.platform() === 'win32'

	let appRoot = process.cwd()
  // If inside <appname>.asar try to load from .asar.unpacked
  // this only works if asar was built with
  // asar --unpack-dir=node_modules/go-ipfs-dep/* (not tested)
  // or
  // electron-packager ./ --asar.unpackDir=node_modules/go-ipfs-dep
  if (appRoot.includes(`.asar${path.sep}`)) {
    appRoot = appRoot.replace(`.asar${path.sep}`, `.asar.unpacked${path.sep}`)
	}

	let command = path.join(appRoot, 'node_modules', 'go-ipfs-dep', 'go-ipfs', isWindows ? 'ipfs.exe' : 'ipfs')

	let args = [
      'init',
			'--empty-repo',
      path.join(appRoot, 'src', 'lib', 'IpfsConfig.json')
	]

	let options = {
		env: {
			'IPFS_PATH': path.join(app.getPath('userData'), '/ipfs'),
		}
	}

	let ipfs = spawn(command, args, options)

	ipfs.stdout.on('data', (data) => {
	  console.log(`stdout: ${data}`)
	})

	ipfs.stderr.on('data', (data) => {
	  console.log(`stderr: ${data}`)
	})

	ipfs.on('close', (code) => {
	  console.log(`child process exited with code ${code}`)

		let args = [
	      'daemon',
				'--routing=dhtclient',
		]

		ipfs = spawn(command, args, options)

		ipfs.stdout.on('data', (data) => {
		  console.log(`stdout: ${data}`)
		})

		ipfs.stderr.on('data', (data) => {
		  console.log(`stderr: ${data}`)
		})

		ipfs.on('close', (code) => {
		  console.log(`child process exited with code ${code}`)
		})

	})
}
