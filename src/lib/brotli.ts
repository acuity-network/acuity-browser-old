import zlib from 'zlib'

function compress(input: any) {
  return zlib.brotliCompressSync(Buffer.from(input))
}

function decompress(input: any) {
  return zlib.brotliDecompressSync(input)
}

export default { compress, decompress }
