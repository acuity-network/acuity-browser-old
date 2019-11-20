const path = require('path')

var webpack = require('webpack')

module.exports = {
  configureWebpack: {
//    context: path.join(__dirname, 'src', 'renderer'),
    entry: path.join(__dirname, 'src', 'renderer', 'main.ts'),
    plugins: [
      new webpack.NormalModuleReplacementPlugin(
        /\/src\/lib\/Image\.js/,
        'web/Image.js'
      ),
      new webpack.NormalModuleReplacementPlugin(
        /\/src\/lib\/brotli\.ts/,
        'web/brotli.ts'
      ),
      new webpack.NormalModuleReplacementPlugin(
        /\/src\/lib\/db\.ts/,
        'web/db.ts'
      ),
      new webpack.NormalModuleReplacementPlugin(
        /\/src\/lib\/MixClient\.ts/,
        'web/MixClient.ts'
      ),
      new webpack.NormalModuleReplacementPlugin(
        /\/src\/lib\/IpfsClient\.ts/,
        'web/IpfsClient.ts'
      ),
    ]
  },
}
