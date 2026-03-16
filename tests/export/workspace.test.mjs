import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import pkg from '../../package.json' with { type: 'json' };
import mappings from '../../config/display-mappings.json' with { type: 'json' };

test('package scripts and display mappings expose required keys', () => {
  assert.equal(typeof pkg.scripts.test, 'string');
  assert.equal(typeof pkg.scripts['export:act2autochess'], 'string');
  assert.equal(typeof pkg.scripts.serve, 'string');

  assert.equal(mappings.professionLabels.SNIPER, '狙击');
  assert.equal(mappings.subProfessionLabels.fastshot, '速射手');
  assert.equal(mappings.rarityLabels.TIER_5, '五星');
});

test('root-served index.html references web asset paths explicitly', async () => {
  const html = await readFile(new URL('../../web/index.html', import.meta.url), 'utf8');

  assert.match(html, /href="\/web\/styles\.css"/);
  assert.match(html, /src="\/web\/app\.mjs"/);
});
