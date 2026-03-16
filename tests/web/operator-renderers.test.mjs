import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderOperatorDetailMarkup } from '../../web/operator-renderers.mjs';

const sampleView = {
  detailSummary: {
    name: '能天使',
    sourceKind: 'fixed',
    sourceLabel: '固定编队',
    professionLabel: '狙击',
    subProfessionLabel: '速射手',
    rarityLabel: '六星',
    tierLabel: 'V阶',
    purchasePrice: 2,
    sellPrice: 1,
    avatarUrl: null,
    avatarFallbackUrls: [],
  },
  bondRows: [
    {
      bondId: 'lateranoShip',
      name: '拉特兰',
      category: { key: 'core', label: '核心盟约' },
      desc: '盟约说明',
    },
    {
      bondId: 'rhineShip',
      name: '莱茵生命',
      category: { key: 'extra', label: '附加盟约' },
      desc: '盟约说明',
    },
  ],
  phaseSections: [],
};

test('renderOperatorDetailMarkup keeps operator bonds in a compact chip list', () => {
  const markup = renderOperatorDetailMarkup(sampleView);

  assert.match(markup, /operator-bond-list/);
  assert.match(markup, /class="bond-chip"/);
  assert.match(markup, />拉特兰<\/span>/);
  assert.doesNotMatch(markup, /核心盟约/);
  assert.doesNotMatch(markup, /附加盟约/);
  assert.doesNotMatch(markup, /<div class="stack">[\s\S]*data-bond-id/);
  assert.doesNotMatch(markup, /<article class="card">[\s\S]*盟约说明/);
});

test('styles keep desktop operator page height bounded instead of growing with the middle column', async () => {
  const css = await readFile(new URL('../../web/styles.css', import.meta.url), 'utf8');

  assert.match(css, /\.desktop-operator-page,[\s\S]*height:\s*calc\(100vh - 188px\)/);
  assert.match(css, /\.operator-bond-list[\s\S]*display:\s*flex/);
  assert.match(css, /\.bond-chip[\s\S]*min-width:\s*88px/);
});
