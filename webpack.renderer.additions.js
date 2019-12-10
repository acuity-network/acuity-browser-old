module.exports = {
  module: {
    rules: [
      {
        test: /\.bin$/,
        use: 'raw-loader'
      }
    ]
  }
}
