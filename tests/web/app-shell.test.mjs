import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAppShell } from '../../web/app-shell.mjs';
import { renderOperatorDesktopPage } from '../../web/operator-page.mjs';
import { renderFormationDesktopPage } from '../../web/formation-page.mjs';

test('renderOperatorDesktopPage keeps filters left, results center, and operator detail right', () => {
  const html = renderOperatorDesktopPage({
    filterMarkup: '<div data-filter-root></div>',
    resultsMarkup: '<div data-results-root></div>',
    detailMarkup: '<div data-operator-detail></div>',
  });

  assert.match(html, /data-desktop-operator-page/);
  assert.match(html, /desktop-filter-panel/);
  assert.match(html, /desktop-results-panel/);
  assert.match(html, /desktop-detail-panel/);
  assert.match(html, /data-filter-root/);
  assert.match(html, /data-results-root/);
  assert.match(html, /data-operator-detail/);
});

test('renderFormationDesktopPage keeps list left, strategy-slots-summary center, and operator detail right', () => {
  const html = renderFormationDesktopPage({
    listMarkup: '<div data-formation-list></div>',
    detailMarkup: '<div data-strategy-panel></div><div data-formation-grid></div><div data-bond-summary></div>',
    operatorMarkup: '<div data-formation-operator-detail></div>',
  });

  assert.match(html, /data-desktop-formation-page/);
  assert.match(html, /desktop-formation-list-panel/);
  assert.match(html, /desktop-formation-detail-panel/);
  assert.match(html, /desktop-formation-operator-panel/);
  assert.match(html, /data-strategy-panel/);
  assert.match(html, /data-formation-grid/);
  assert.match(html, /data-bond-summary/);
  assert.match(html, /data-formation-operator-detail/);
  assert.doesNotMatch(html, /data-bond-popover-panel/);
});

test('renderAppShell keeps shared top navigation and swaps the active page', () => {
  const html = renderAppShell({
    activeMode: 'formations',
    pageMarkup: '<section data-desktop-formation-page></section>',
  });

  assert.match(html, /data-app-shell/);
  assert.match(html, /data-mode-tab="operators"/);
  assert.match(html, /data-mode-tab="formations"/);
  assert.match(html, /is-active/);
  assert.match(html, /data-desktop-formation-page/);
});
