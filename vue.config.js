const path = require('path')

var webpack = require('webpack')

module.exports = {
  configureWebpack: {
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
      new webpack.NormalModuleReplacementPlugin(
        /\/src\/lib\/clipboard\.ts/,
        'web/clipboard.ts'
      ),
      new webpack.NormalModuleReplacementPlugin(
        /\/src\/lib\/setTitle\.ts/,
        'web/setTitle.ts'
      ),
      new webpack.NormalModuleReplacementPlugin(
        /\/src\/lib\/transcoder\.ts/,
        'web/transcoder.ts'
      ),
      new webpack.NormalModuleReplacementPlugin(
        /\/src\/renderer\/components\/Mining\.vue/,
        'web/Mining.vue'
      ),
      new webpack.NormalModuleReplacementPlugin(
        /\/src\/renderer\/components\/mixins\/VideoEdit\.vue/,
        'web/VideoEdit.vue'
      ),
    ]
  },
  chainWebpack: config => {
    config.module
      .rule('raw')
      .test(/\.bin$/)
      .use('raw-loader')
      .loader('raw-loader')
      .end()
    config.resolve.alias
      .set('pica', 'pica/dist/pica.js')
  }
}
