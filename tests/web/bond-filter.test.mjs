import test from 'node:test';
import assert from 'node:assert/strict';
import { renderBondFilterMarkup, shouldCloseBondPanel } from '../../web/bond-filter.mjs';

const filterOptions = {
  bondGroups: [
    {
      label: '核心盟约',
      items: [
        { value: 'lateranoShip', name: '拉特兰' },
      ],
    },
  ],
};

test('renderBondFilterMarkup keeps the field label outside the trigger button', () => {
  const markup = renderBondFilterMarkup(filterOptions, { bondIds: [] }, { bondPanelOpen: false });

  assert.match(markup, /filter-field-label">盟约筛选<\/span>/);
  assert.match(markup, /<strong>全部盟约<\/strong>/);
  assert.doesNotMatch(markup, /<button[\s\S]*盟约筛选[\s\S]*<strong>/);
});

test('shouldCloseBondPanel closes only when the panel is open and the click is outside', () => {
  assert.equal(shouldCloseBondPanel({ bondPanelOpen: true, clickedInsideBondFilter: false }), true);
  assert.equal(shouldCloseBondPanel({ bondPanelOpen: true, clickedInsideBondFilter: true }), false);
  assert.equal(shouldCloseBondPanel({ bondPanelOpen: false, clickedInsideBondFilter: false }), false);
});
