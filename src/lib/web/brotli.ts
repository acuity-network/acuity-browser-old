let BrotliDecode: any = require('./decode.js')
let brotliHaxe: any = require('./brotliHaxe.js')
let brotli: any = new brotliHaxe.Brotli()

function compress(input: any) {
  return brotli.compressArray(input, 11)
}

function decompress(input: any) {
  return BrotliDecode(input)
}

export default { compress, decompress }
