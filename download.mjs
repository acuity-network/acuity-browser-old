import fs from 'fs'
import os from 'os'
import path from 'path'
import process from 'process'
import download from 'download'

let urls = {
	linux: {
		parity: 'https://releases.parity.io/ethereum/v2.4.8/x86_64-unknown-linux-gnu/parity',
		ipfs: 'https://github.com/ipfs/go-ipfs/releases/download/v0.4.21/go-ipfs_v0.4.21_linux-amd64.tar.gz',
		ethminer: 'https://github.com/ethereum-mining/ethminer/releases/download/v0.17.1/ethminer-0.17.1-linux-x86_64.tar.gz',
	},
	darwin: {
		parity: 'https://releases.parity.io/ethereum/v2.4.8/x86_64-apple-darwin/parity',
		ipfs: 'https://github.com/ipfs/go-ipfs/releases/download/v0.4.21/go-ipfs_v0.4.21_darwin-amd64.tar.gz',
		ethminer: 'https://github.com/ethereum-mining/ethminer/releases/download/v0.17.1/ethminer-0.17.1-darwin-x86_64.tar.gz',
	},
	win32: {
		parity: 'https://releases.parity.io/ethereum/v2.4.8/x86_64-pc-windows-msvc/parity.exe',
		ipfs: 'https://github.com/ipfs/go-ipfs/releases/download/v0.4.21/go-ipfs_v0.4.21_windows-amd64.zip',
		ethminer: 'https://github.com/ethereum-mining/ethminer/releases/download/v0.17.1/ethminer-0.17.1-cuda10.0-windows-amd64.zip',
	},
}

try {
	if (parseInt(fs.readFileSync('download_rev')) >= 2) {
		process.exit(0)
	}
} catch (e) {}

let archUrls = urls[os.platform()]

console.log('Downloading ' + archUrls['parity'])
let parity = download(archUrls['parity'], 'static')
.then(result => {
	let parityPath = path.join('static', (os.platform() == 'win32') ? 'parity.exe' : 'parity')
	fs.chmodSync(parityPath, '755');
})

console.log('Downloading ' + archUrls['ipfs'])
let ipfs = download(archUrls['ipfs'], 'static', {extract: true})

console.log('Downloading ' + archUrls['ethminer'])
let ethminer = download(archUrls['ethminer'], path.join('static', 'ethminer'), {extract: true})

Promise.all([parity, ipfs, ethminer])
.then(() => {
	fs.writeFileSync('download_rev', '2')
	process.exit(0)
})
.catch(e => {
	console.log("Downloading failed.")
	process.exit(1)
})
