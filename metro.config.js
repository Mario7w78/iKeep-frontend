const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable symlinks for pnpm compatibility
config.resolver.unstable_enableSymlinks = true;

// Watchman falla/es inestable en este Mac (se queda colgado en watch-project).
// Con useWatchman: false Metro usa el watcher nativo de Node y despega siempre.
config.resolver.useWatchman = false;

// Las animaciones Rive se cargan con require(): sin registrar la extensión,
// Metro no las resuelve como assets y el bundle revienta en tiempo de build.
config.resolver.assetExts.push('riv');

module.exports = config;
