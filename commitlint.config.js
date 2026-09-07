/** Conventional commits, enforced by lefthook's commit-msg hook. */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // The scopes this repo actually uses. Keeps `feat(stuff)` out.
    'scope-enum': [
      2,
      'always',
      ['theme', 'components', 'icons', 'app', 'data', 'lib', 'dev', 'design', 'build', 'deps'],
    ],
    'header-max-length': [2, 'always', 100],
  },
};
