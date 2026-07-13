/** Metro config — wraps Expo defaults with NativeWind CSS transform. */
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Feed global.css through NativeWind so tokens compile into styles.
module.exports = withNativeWind(config, { input: './global.css' });
