import BrotliDecode from './decode.js'
import brotliHaxe from './brotliHaxe.js'

var brotli = new brotliHaxe.Brotli();

function compress(input) {
  return brotli.compressArray(input, 11)
}

function decompress(input) {
  return BrotliDecode(input)
//  return brotli.decompressArray(input)
}

export default { compress, decompress }
