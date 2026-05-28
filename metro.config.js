const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wav');
// Supabase uses package exports which confuses Metro
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
