import BrotliDecode from './decode.js'
import brotliHaxe from './brotliHaxe.js'

var brotli = new brotliHaxe.Brotli();

function compress(input: Buffer) {
  return brotli.compressArray(input, 11)
}

function decompress(input: Buffer) {
  return BrotliDecode(input)
}

export default { compress, decompress }
