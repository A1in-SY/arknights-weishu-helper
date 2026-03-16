import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAvatarMarkup, pickNextAvatarSource } from '../../web/avatar-fallback.mjs';

test('buildAvatarMarkup keeps a hidden text placeholder even when an avatar url exists', () => {
  const markup = buildAvatarMarkup({
    name: 'Raidian',
    avatarUrl: 'https://example.com/avatar.png',
    avatarFallbackUrls: ['https://example.com/avatar-2.png'],
    className: 'candidate-avatar',
  });

  assert.match(markup, /data-prts-avatar/);
  assert.match(markup, /avatar-fallback is-hidden/);
  assert.match(markup, />R</);
});

test('pickNextAvatarSource falls back to placeholder when all avatar urls are exhausted', () => {
  assert.deepEqual(pickNextAvatarSource([]), {
    nextUrl: null,
    remainingUrls: [],
    shouldShowPlaceholder: true,
  });
});
