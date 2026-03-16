import test from 'node:test';
import assert from 'node:assert/strict';
import { renderFormationPanelMarkup } from '../../web/formation-panel.mjs';

const formationsState = {
  formations: [
    {
      formationId: 'formation-1',
      name: '测试编队',
      notes: '测试备注',
      strategyId: 'band_duyaoy',
      entries: [
        { entryId: 'entry-1', operatorKey: 'fixed:char_exusiai', transferredBondId: null },
      ],
    },
  ],
  selectedFormationId: 'formation-1',
  selectedEntryId: 'entry-1',
};

const operators = [
  {
    operatorKey: 'fixed:char_exusiai',
    charId: 'char_exusiai',
    name: '能天使',
    source: { label: '固定编队' },
    shop: { tier: { label: 'V阶' } },
    avatarUrl: null,
    avatarFallbackUrls: [],
    bonds: [
      { bondId: 'lateranoShip', name: '拉特兰' },
    ],
  },
];

const bonds = [
  { bondId: 'lateranoShip', name: '拉特兰', identifier: 5, category: { key: 'core', label: '核心盟约' }, desc: 'desc', activationThreshold: 2 },
];

const strategies = [
  {
    strategyId: 'band_duyaoy',
    name: '杜遥夜',
    iconId: 'icon_duyaoy',
    iconPath: '/data/act2autochess/assets/strategies/band_duyaoy.png',
    totalHp: 29,
    unlockDesc: null,
    effectId: 'aceffect_band_28',
    effectName: '广交豪杰',
    effectDesc: '第一行\n第二行',
  },
  {
    strategyId: 'band_amiya',
    name: '阿米娅',
    iconId: 'icon_amiya',
    iconPath: '/data/act2autochess/assets/strategies/band_amiya.png',
    totalHp: 35,
    unlockDesc: '初始解锁',
    effectId: 'aceffect_band_99',
    effectName: '稳扎稳打',
    effectDesc: '说明',
  },
];

test('renderFormationPanelMarkup keeps strategy choices in a popup panel instead of always expanding them', () => {
  const markup = renderFormationPanelMarkup({
    formationsState,
    operators,
    bonds,
    strategies,
    uiState: { strategyPanelOpen: false },
    selectedOperator: {
      name: '能天使',
      operatorKey: 'fixed:char_exusiai',
    },
  });

  assert.match(markup, /加入当前选中干员：能天使/);
  assert.match(markup, /data-formation-entry-id="entry-1"/);
  assert.match(markup, /data-detail-bond-id="lateranoShip"/);
  assert.match(markup, /data-strategy-id="band_duyaoy"/);
  assert.match(markup, /data-strategy-panel-toggle/);
  assert.match(markup, /广交豪杰/);
  assert.match(markup, /class="preserve-lines"/);
  assert.match(markup, /<span>1\/2<\/span>/);
  assert.match(markup, /未满足盟约/);
  assert.doesNotMatch(markup, /strategy-choice-list/);
  assert.doesNotMatch(markup, /固定编队<\/span>[\s\S]*V阶/);
});

test('renderFormationPanelMarkup renders strategy popup content only when opened', () => {
  const markup = renderFormationPanelMarkup({
    formationsState,
    operators,
    bonds,
    strategies,
    uiState: { strategyPanelOpen: true },
    selectedOperator: {
      name: '能天使',
      operatorKey: 'fixed:char_exusiai',
    },
  });

  assert.match(markup, /strategy-choice-list/);
  assert.match(markup, /data-formation-strategy="band_duyaoy"/);
  assert.match(markup, /data-formation-strategy="band_amiya"/);
  assert.doesNotMatch(markup, /strategy-choice-copy/);
  assert.match(markup, /title="杜遥夜"/);
  assert.match(markup, /title="阿米娅"/);
});

test('renderFormationPanelMarkup suppresses the known wrong 杜遥夜 cached icon and falls back to placeholder', () => {
  const markup = renderFormationPanelMarkup({
    formationsState,
    operators,
    bonds,
    strategies,
    uiState: { strategyPanelOpen: true },
    selectedOperator: {
      name: '能天使',
      operatorKey: 'fixed:char_exusiai',
    },
  });

  assert.doesNotMatch(markup, /band_duyaoy\.png/);
});

test('renderFormationPanelMarkup shows personnel document warning for full formations', () => {
  const markup = renderFormationPanelMarkup({
    formationsState: {
      ...formationsState,
      formations: [
        {
          ...formationsState.formations[0],
          entries: Array.from({ length: 9 }, (_, index) => ({
            entryId: `entry-${index}`,
            operatorKey: 'fixed:char_exusiai',
            transferredBondId: null,
          })),
        },
      ],
    },
    operators,
    bonds,
    strategies,
    uiState: { strategyPanelOpen: false },
    selectedOperator: {
      name: '能天使',
      operatorKey: 'fixed:char_exusiai',
    },
  });

  assert.match(markup, /该编队需要“人事部文档”道具/);
});

test('renderFormationPanelMarkup marks formation notes textarea for autosize behavior', () => {
  const markup = renderFormationPanelMarkup({
    formationsState,
    operators,
    bonds,
    strategies,
    uiState: { strategyPanelOpen: false },
    selectedOperator: {
      name: '能天使',
      operatorKey: 'fixed:char_exusiai',
    },
  });

  assert.match(markup, /<textarea[^>]*data-formation-notes[^>]*data-autosize="true"/);
});
