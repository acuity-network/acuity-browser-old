import zlib from 'zlib'

function compress(input) {
  return zlib.brotliCompressSync(Buffer.from(input))
}

function decompress(input) {
  return zlib.brotliDecompressSync(input)
}

export default { compress, decompress }
