import brotli from 'iltorb'

function compress(input: Buffer) {
  return brotli.decompress(input)
}

function decompress(input: Buffer) {
  return brotli.decompress(input)
}

export default { compress, decompress }
