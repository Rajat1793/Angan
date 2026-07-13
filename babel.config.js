/** Babel config — Expo preset + NativeWind JSX + Reanimated worklets plugin. */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Reanimated plugin must be listed last per its docs.
    plugins: ['react-native-reanimated/plugin'],
  };
};
