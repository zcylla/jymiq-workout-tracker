const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'drizzle/*', 'claudedocs/*'] },
  {
    rules: {
      // Reanimated shared values must be read with .get()/.set(). Under React
      // Compiler a `.value` read is a mutable read the compiler cannot see, so
      // it caches a stale frame. The SV suffix is what makes this greppable.
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[property.name='value'][object.name=/SV$/]",
          message: 'Shared values: use .get() / .set(), never .value (React Compiler).',
        },
      ],
    },
  },
]);
