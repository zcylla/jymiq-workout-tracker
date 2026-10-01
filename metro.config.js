const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname);
config.resolver.sourceExts.push('sql');
config.resolver.blockList = [].concat(
  config.resolver.blockList ?? [],
  /[\\/]\.claude[\\/]worktrees[\\/].*/,
);

module.exports = config;
