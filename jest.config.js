module.exports = {
  preset: 'jest-expo',
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
};
