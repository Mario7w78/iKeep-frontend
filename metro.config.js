const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable symlinks for pnpm compatibility
config.resolver.unstable_enableSymlinks = true;

// Las animaciones Rive se cargan con require(): sin registrar la extensión,
// Metro no las resuelve como assets y el bundle revienta en tiempo de build.
config.resolver.assetExts.push('riv');

module.exports = config;
