import { app } from 'electron'
import path from 'path'
import Web3 from 'web3'
import net from 'net'
import os from 'os'
import { spawn } from 'child_process'

let parityProcess

async function launch(window) {
	let isWindows = os.platform() === 'win32'
	let parityPath

	if (process.env.NODE_ENV !== 'development') {
		parityPath = path.join(app.getAppPath(), '..')
	}
	else {
		parityPath = path.join(app.getAppPath(), '..', '..', '..', '..', '..', 'src')
	}

	parityPath = path.join(parityPath, 'extraResources', isWindows ? 'parity.exe' : 'parity')
	console.log('Parity path: ' + parityPath)

	let ipcPath

	if (os.platform() === 'win32') {
		ipcPath = '\\\\.\\pipe\\mix.ipc'
	}
	else {
		ipcPath = path.join(app.getPath('userData'), 'parity.ipc')
	}

	console.log('Parity IPC path: ' + ipcPath)

	let args = [
		'--no-download',
		'--no-consensus',
		'--chain=mix',
		'--no-jsonrpc',
		'--no-ws',
		'--ipc-path=' + ipcPath,
		'--no-secretstore',
		'--force-sealing',
		'--infinite-pending-block',
		'--reseal-on-txs=all',
		'--reseal-min-period=0',
		'--reseal-max-period=600000',
		'--can-restart',
		'--pruning=fast',
		'--pruning-history=64',
		'--pruning-memory=0',
		'--logging=error',
	]

	parityProcess = spawn(parityPath, args)

	parityProcess.on('error', (err) => {
		try {
			window.webContents.send('parity-error', 'Failed to start (' + err + ')')
		} catch (e) {}
	});

	parityProcess.stdout.on('data', (data) => {
		try {
			window.webContents.send('parity-stdout', data.toString())
		} catch (e) {}
	})

	parityProcess.stderr.on('data', (data) => {
		try {
			window.webContents.send('parity-stderr', data.toString())
		} catch (e) {}
	})

	window.webContents.send('parity-running')
}

async function kill() {
	parityProcess.kill()
}

export default { launch, kill }
