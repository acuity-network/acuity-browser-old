import { clipboard } from 'electron'

function readText() {
  return clipboard.readText()
}

function writeText(text: string) {
  clipboard.writeText(text)
}

export default { readText, writeText }
