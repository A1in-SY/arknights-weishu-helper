import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStrategySourceUrls } from '../../scripts/sync-prts-assets.mjs';

test('buildStrategySourceUrls does not use the unrelated 遥 avatar for 杜遥夜', () => {
  const urls = buildStrategySourceUrls({
    strategyId: 'band_duyaoy',
    name: '杜遥夜',
  });

  assert.deepEqual(urls, [
    'https://prts.wiki/index.php?title=Special:Redirect/file/%E5%A4%B4%E5%83%8F_%E6%9D%9C%E9%81%A5%E5%A4%9C.png',
    'https://prts.wiki/index.php?title=Special:Redirect/file/%E5%A4%B4%E5%83%8F_%E6%9D%9C%E9%81%A5%E5%A4%9C_2.png',
  ]);
});
