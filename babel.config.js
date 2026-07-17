/** Babel config — Expo preset + NativeWind JSX + Reanimated worklets plugin. */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Worklets plugin must be listed last (Reanimated 4 uses react-native-worklets).
    plugins: ['react-native-worklets/plugin'],
  };
};
