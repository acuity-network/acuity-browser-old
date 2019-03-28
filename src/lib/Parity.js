import * as parity from '@parity/electron';

export default async function launchParity(window) {

	let parityPath

	try {
		parityPath = await parity.getParityPath()
	}
	catch (e) {
		parityPath = await parity.fetchParity(window, { parityChannel: 'v2.3.7', onProgress: (progress) => {}})
	}

	let flags = [
		'--no-download',
		'--no-consensus',
		'--chain=mix',
		'--no-jsonrpc',
		'--no-ws',
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

	parity.runParity({parityPath: parityPath, flags: flags, onParityError: (error) => console.error(error)})
}
