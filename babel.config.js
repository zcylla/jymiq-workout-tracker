module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Drizzle's generated migrations are .sql files imported as strings. Metro
    // also needs 'sql' in resolver.sourceExts (see metro.config.js) — miss either
    // and the failure is a stale bundle, not an error.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
