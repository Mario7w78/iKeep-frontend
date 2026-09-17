module.exports = {
  preset: 'jest-expo',
  setupFiles: [
    // react-native-gesture-handler instala su mock nativo en Jest; sin esto,
    // renderizar un GestureHandlerRootView (PendientesDeck) revienta con
    // "_RNGestureHandlerModule.default.install is not a function".
    './node_modules/react-native-gesture-handler/jestSetup.js',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    // El mock manual se llama "rive-react-native" (sin scope), pero Sapo.tsx
    // importa el paquete scoped "@rive-app/react-native": sin este mapeo el
    // runner resuelve el paquete real, que es ESM/Flow y no transforma.
    '@rive-app/react-native$': '<rootDir>/__mocks__/rive-react-native.tsx',
    '\\.(riv)$': '<rootDir>/__mocks__/rivAsset.js',
  },
};
