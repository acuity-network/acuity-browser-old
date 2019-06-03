import { remote } from 'electron'

let window = remote.getCurrentWindow()

export default function setTitle(title) {
	window.setTitle(title + ' - MIX Acuity')
}
