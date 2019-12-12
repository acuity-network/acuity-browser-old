import brotli from 'iltorb'

function compress(input) {
  return brotli.compress(Buffer.from(input))
}

function decompress(input) {
  return brotli.decompress(input)
}

export default { compress, decompress }
