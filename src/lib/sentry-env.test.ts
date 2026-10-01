import assert from 'node:assert/strict';
import { test } from 'node:test';

import { sentryEnvironment } from './sentry-env.ts';

test('Sentry environment is production for the production application id', () => {
  assert.equal(sentryEnvironment('com.zcylla.jymiq'), 'production');
});

test('Sentry environment is development for the dev application id', () => {
  assert.equal(sentryEnvironment('com.zcylla.jymiq.dev'), 'development');
});

test('Sentry environment defaults to production for null', () => {
  assert.equal(sentryEnvironment(null), 'production');
});

test('Sentry environment defaults to production for undefined', () => {
  assert.equal(sentryEnvironment(undefined), 'production');
});

test('Sentry environment is production for an unrelated application id', () => {
  assert.equal(sentryEnvironment('com.example.other'), 'production');
});

test('Sentry environment is production when dev is not the final suffix', () => {
  assert.equal(sentryEnvironment('com.zcylla.jymiq.devtools'), 'production');
});
