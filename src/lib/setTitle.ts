import { remote } from 'electron'

let window = remote.getCurrentWindow()

export default function setTitle(title: string) {
	window.setTitle(title + ' - MIX Acuity Browser')
}
