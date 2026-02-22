const {getDefaultConfig} = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configurar Metro para que solo observe el directorio mobile-app
config.watchFolders = [__dirname];

// Excluir el directorio padre del monorepo
config.resolver.blockList = [
  /\.\.\/node_modules\/.*/,
  /\.\.\/web-admin\/.*/,
  /\.\.\/backend\/.*/,
];

module.exports = config;
