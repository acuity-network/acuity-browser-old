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
		'--chain=mix',
	]

	parity.runParity({parityPath: parityPath, flags: flags, onParityError: (error) => console.error(error)})
}
