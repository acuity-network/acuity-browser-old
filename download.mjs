import fs from 'fs'
import os from 'os'
import path from 'path'
import process from 'process'
import download from 'download'
import child_process from 'child_process'
import util from 'util'
let exec = util.promisify(child_process.exec)

let rev = 14

let urls = {
	linux: {
		parity: 'https://releases.parity.io/ethereum/v2.7.1/x86_64-unknown-linux-gnu/parity',
		ipfs: 'https://github.com/ipfs/go-ipfs/releases/download/v0.4.23/go-ipfs_v0.4.23_linux-amd64.tar.gz',
    ffmpeg: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
    youtubeDl: 'https://yt-dl.org/downloads/2020.01.24/youtube-dl',
	},
	darwin: {
		parity: 'https://releases.parity.io/ethereum/v2.7.1/x86_64-apple-darwin/parity',
		ipfs: 'https://github.com/ipfs/go-ipfs/releases/download/v0.4.23/go-ipfs_v0.4.23_darwin-amd64.tar.gz',
    ffmpeg: 'https://ffmpeg.zeranoe.com/builds/macos64/shared/ffmpeg-4.2.2-macos64-shared.zip',
    youtubeDl: 'https://yt-dl.org/downloads/2020.01.24/youtube-dl',
	},
	win32: {
		parity: 'https://releases.parity.io/ethereum/v2.7.1/x86_64-pc-windows-msvc/parity.exe',
		ipfs: 'https://github.com/ipfs/go-ipfs/releases/download/v0.4.23/go-ipfs_v0.4.23_windows-amd64.zip',
    ffmpeg: 'https://ffmpeg.zeranoe.com/builds/win64/shared/ffmpeg-4.2.2-win64-shared.zip',
    youtubeDl: 'https://yt-dl.org/downloads/2020.01.24/youtube-dl.exe',
	},
}

try {
	if (parseInt(fs.readFileSync('download_rev')) >= rev) {
		process.exit(0)
	}
} catch (e) {}

let platform = os.platform()

let archUrls = urls[platform]

console.log('Downloading ' + archUrls['parity'])
let parity = download(archUrls['parity'], 'public')
.then(result => {
	let parityPath = path.join('public', (platform == 'win32') ? 'parity.exe' : 'parity')
	fs.chmodSync(parityPath, '755');
})

console.log('Downloading ' + archUrls['ipfs'])
let ipfs = download(archUrls['ipfs'], 'public', {extract: true})

console.log('Downloading ' + archUrls['ffmpeg'])
let ffmpeg = download(archUrls['ffmpeg'], 'public', {extract: (platform == 'linux') ? false : true})

console.log('Downloading ' + archUrls['youtubeDl'])
let youtubeDl = download(archUrls['youtubeDl'], 'public')
.then(result => {
	let youtubeDlPath = path.join('public', (platform == 'win32') ? 'youtube-dl.exe' : 'youtube-dl')
	fs.chmodSync(youtubeDlPath, '755');
})

Promise.all([parity, ipfs, ffmpeg, youtubeDl])
.then(async () => {
  await exec('rm -rf public/ffmpeg')
  switch (platform) {
    case 'linux':
      await exec('rm -rf temp')
      fs.mkdirSync('temp')
      // needs xz-utils
      await exec('tar xf public/ffmpeg-release-amd64-static.tar.xz -C temp')
      fs.unlinkSync('public/ffmpeg-release-amd64-static.tar.xz')
      fs.mkdirSync('public/ffmpeg')
      fs.mkdirSync('public/ffmpeg/bin')
      fs.renameSync('temp/ffmpeg-4.2.2-amd64-static/ffmpeg', 'public/ffmpeg/bin/ffmpeg')
      await exec('rm -rf temp')
      break

    case 'darwin':
      fs.renameSync('public/ffmpeg-4.2.2-macos64-shared', 'public/ffmpeg')
      break

    case 'win32':
      fs.renameSync('public/ffmpeg-4.2.2-win64-shared', 'public/ffmpeg')
      break
  }
	fs.writeFileSync('download_rev', rev)
	process.exit(0)
})
.catch(e => {
	console.log("Downloading failed: " + e)
	process.exit(1)
})
