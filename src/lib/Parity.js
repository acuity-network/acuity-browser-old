import * as parity from '@parity/electron';
import { app } from 'electron'
import path from 'path'
import Web3 from 'web3'
import net from 'net'

async function launch(window) {

	let parityPath
	let ipcPath = path.join(app.getPath('userData'), 'parity.ipc')

	try {
		parityPath = await parity.getParityPath()
	}
	catch (e) {
		parityPath = await parity.fetchParity(window, { parityChannel: 'v2.4.5', onProgress: (progress) => {
			window.webContents.send('parity-download-progress', progress)
		}})
	}

	let flags = [
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
	]

	await parity.runParity({parityPath: parityPath, flags: flags, onParityError: (error) => console.error(error)})
	// Wait for IPC to come up.
	let success = false
	let web3 = new Web3(new Web3.providers.IpcProvider(ipcPath, net))
	do {
		try {
			await web3.eth.getProtocolVersion()
			success = true
		}
		catch (e) {}
	} while (!success)

	window.webContents.send('parity-running')
}

async function kill() {
	parity.killParity()
}

export default { launch, kill }
