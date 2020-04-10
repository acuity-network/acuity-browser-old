let BrotliDecode: any = require('./decode.js').default
let brotliHaxe: any = require('./brotliHaxe.js').default
let brotli: any = new brotliHaxe.Brotli()

function compress(input: any) {
  return brotli.compressArray(input, 11)
}

function decompress(input: any) {
  return BrotliDecode(input)
}

export default { compress, decompress }
