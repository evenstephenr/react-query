const path = require('path');

module.exports = {
  mode: 'development',
  target: 'web',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'index.js',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.(jsx|js|tsx|ts)$/,
        include: path.resolve(__dirname, 'src'),
        use: [{
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                'targets': 'defaults' 
              }],
              '@babel/preset-react',
              "@babel/preset-typescript"
            ]
          }
        }]
      },
    ]
  }
};
