import Web3 from 'web3'
import net from 'net'
import { app } from 'electron'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'

declare let __static: string

let parityProcess

async function launch(window) {
  let isWindows: boolean = os.platform() === 'win32'
  let ipcPath: string
  // Check if Parity is already running.
  if (isWindows) {
    ipcPath = '\\\\.\\pipe\\mix.ipc'
  }
  else {
    ipcPath = '/mix.ipc'
  }
  try {
    let web3: Web3 = new Web3(new Web3.providers.IpcProvider(ipcPath, net))
    await web3.eth.getProtocolVersion()
    console.log('Parity IPC path: ' + ipcPath)
    window.webContents.on('ipc-message', (e, msg) => {
      if (msg == 'get-parity-ipc-path') {
        window.webContents.send('parity-ipc-path', ipcPath)
      }
    })
    window.webContents.send('parity-ipc-path', ipcPath)
    return
  }
  catch (e) {}
  // Start Parity.
	let parityPath: string = path.join(__static, isWindows ? 'parity.exe' : 'parity')
	console.log('Parity path: ' + parityPath)
	if (isWindows) {
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
		'--port=0',
		'--jsonrpc-port=8645',
		'--jsonrpc-apis=net,parity_set',
		'--jsonrpc-cors=all',
		'--no-ws',
		'--ipc-path=' + ipcPath,
		'--no-secretstore',
		'--force-sealing',
		'--reseal-on-uncle',
		'--stratum',
		'--reseal-on-txs=all',
		'--reseal-min-period=0',
		'--reseal-max-period=600000',
		'--relay-set=strict',
		'--min-gas-price=1',
		'--extra-data=Acuity',
		'--can-restart',
		'--pruning=fast',
		'--pruning-history=64',
		'--pruning-memory=0',
		'--logging=warn',
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

  window.webContents.on('ipc-message', (e, msg) => {
    if (msg == 'get-parity-ipc-path') {
      window.webContents.send('parity-ipc-path', ipcPath)
    }
  })
  window.webContents.send('parity-ipc-path', ipcPath)
}

function kill() {
  if (parityProcess) {
    parityProcess.kill()
  }
}

export default { launch, kill }
