import test from 'node:test';
import assert from 'node:assert/strict';
import { applyQuery, createQueryState } from '../../web/app-state.mjs';

const sampleOperators = [
  {
    operatorKey: 'fixed:char_exusiai',
    charId: 'char_exusiai',
    name: '能天使',
    appellation: 'Exusiai',
    source: { kind: 'fixed', label: '固定编队', isInferred: false },
    profession: { code: 'SNIPER', label: '狙击' },
    subProfession: { code: 'fastshot', label: '速射手' },
    rarity: { value: 6, code: 'TIER_6', label: '六星' },
    shop: {
      tier: { value: 5, label: 'V阶' },
      purchasePrice: 2,
      sellPrice: 1,
    },
    bonds: [
      { bondId: 'lateranoShip', name: '拉特兰', iconId: 'icon_lateranoShip', category: { key: 'core', label: '核心盟约' }, desc: '拉特兰说明' },
      { bondId: 'swiftShip', name: '迅捷', iconId: 'icon_swiftShip', category: { key: 'extra', label: '附加盟约' }, desc: '迅捷说明' },
    ],
    phases: [
      {
        key: 'base',
        label: '初始',
        chessId: 'chess_char_5_01_a',
        garrisons: [{ garrisonId: 'garrison_23_a', garrisonDesc: '特质1', triggerTimings: ['常驻/被动'] }],
      },
      {
        key: 'elite',
        label: '精锐',
        chessId: 'chess_char_5_01_b',
        garrisons: [{ garrisonId: 'garrison_23_b', garrisonDesc: '特质1-精锐', triggerTimings: ['常驻/被动'] }],
      },
    ],
  },
  {
    operatorKey: 'fixed:char_nearl',
    charId: 'char_nearl',
    name: '耀骑士临光',
    appellation: 'Nearl the Radiant Knight',
    source: { kind: 'fixed', label: '固定编队', isInferred: false },
    profession: { code: 'WARRIOR', label: '近卫' },
    subProfession: { code: 'fearless', label: '无畏者' },
    rarity: { value: 6, code: 'TIER_6', label: '六星' },
    shop: {
      tier: { value: 6, label: 'VI阶' },
      purchasePrice: 5,
      sellPrice: 2,
    },
    bonds: [
      { bondId: 'kazimierzShip', name: '卡西米尔', iconId: 'icon_kazimierzShip', category: { key: 'core', label: '核心盟约' }, desc: '卡西米尔说明' },
      { bondId: 'raidShip', name: '突袭', iconId: 'icon_raidShip', category: { key: 'extra', label: '附加盟约' }, desc: '突袭说明' },
    ],
    phases: [
      {
        key: 'base',
        label: '初始',
        chessId: 'chess_char_6_17_a',
        garrisons: [
          { garrisonId: 'garrison_145_a', garrisonDesc: '特质2', triggerTimings: ['战斗开始时'] },
          { garrisonId: 'garrison_144_a', garrisonDesc: '特质3', triggerTimings: ['常驻/被动'] },
        ],
      },
      {
        key: 'elite',
        label: '精锐',
        chessId: 'chess_char_6_17_b',
        garrisons: [
          { garrisonId: 'garrison_145_b', garrisonDesc: '特质2-精锐', triggerTimings: ['战斗开始时'] },
          { garrisonId: 'garrison_144_b', garrisonDesc: '特质3-精锐', triggerTimings: ['常驻/被动'] },
        ],
      },
    ],
  },
  {
    operatorKey: 'fixed:char_harold',
    charId: 'char_harold',
    name: '哈洛德',
    appellation: 'Harold',
    source: { kind: 'fixed', label: '固定编队', isInferred: false },
    profession: { code: 'MEDIC', label: '医疗' },
    subProfession: { code: 'wandermedic', label: '行医' },
    rarity: { value: 5, code: 'TIER_5', label: '五星' },
    shop: {
      tier: { value: 2, label: 'II阶' },
      purchasePrice: 2,
      sellPrice: 1,
    },
    bonds: [
      { bondId: 'victoriaShip', name: '维多利亚', iconId: 'icon_victoriaShip', category: { key: 'core', label: '核心盟约' }, desc: '维多利亚说明' },
      { bondId: 'steadShip', name: '坚守', iconId: 'icon_steadShip', category: { key: 'extra', label: '附加盟约' }, desc: '坚守说明' },
    ],
    phases: [
      {
        key: 'base',
        label: '初始',
        chessId: 'chess_char_2_05_a',
        garrisons: [{ garrisonId: 'garrison_09_a', garrisonDesc: '特质4', triggerTimings: ['获得时'] }],
      },
      {
        key: 'elite',
        label: '精锐',
        chessId: 'chess_char_2_05_b',
        garrisons: [{ garrisonId: 'garrison_09_b', garrisonDesc: '特质4-精锐', triggerTimings: ['获得时'] }],
      },
    ],
  },
  {
    operatorKey: 'fixed:char_ines',
    charId: 'char_ines',
    name: '伊内丝',
    appellation: 'Ines',
    source: { kind: 'fixed', label: '固定编队', isInferred: false },
    profession: { code: 'PIONEER', label: '先锋' },
    subProfession: { code: 'agent', label: '情报官' },
    rarity: { value: 6, code: 'TIER_6', label: '六星' },
    shop: {
      tier: { value: 1, label: 'I阶' },
      purchasePrice: 1,
      sellPrice: 0,
    },
    bonds: [
      { bondId: 'columbiaShip', name: '哥伦比亚', iconId: 'icon_columbiaShip', category: { key: 'core', label: '核心盟约' }, desc: '哥伦比亚说明' },
    ],
    phases: [
      {
        key: 'base',
        label: '初始',
        chessId: 'chess_char_1_01_a',
        garrisons: [{ garrisonId: 'garrison_16_a', garrisonDesc: '特质5', triggerTimings: ['休整期结束时'] }],
      },
      {
        key: 'elite',
        label: '精锐',
        chessId: 'chess_char_1_01_b',
        garrisons: [{ garrisonId: 'garrison_16_b', garrisonDesc: '特质5-精锐', triggerTimings: ['休整期结束时'] }],
      },
    ],
  },
  {
    operatorKey: 'diy:char_touch',
    charId: 'char_touch',
    name: 'Touch',
    appellation: 'Touch',
    source: { kind: 'diy', label: '自选编队', isInferred: true },
    profession: { code: 'MEDIC', label: '医疗' },
    subProfession: { code: 'physician', label: '医师' },
    rarity: { value: 6, code: 'TIER_6', label: '六星' },
    shop: {
      tier: { value: 0, label: '无阶级' },
      purchasePrice: 4,
      sellPrice: 1,
    },
    bonds: [
      { bondId: 'emptyShip', name: '协防干员', iconId: 'icon_emptyShip', category: { key: 'extra', label: '附加盟约' }, desc: '协防说明' },
    ],
    phases: [],
  },
];

const sampleOperatorsWithSortTieCases = [
  {
    ...sampleOperators[0],
    operatorKey: 'fixed:char_tier5_exusiai',
    charId: 'char_tier5_exusiai',
    name: '能天使',
    shop: {
      ...sampleOperators[0].shop,
      tier: { value: 5, label: 'V阶' },
    },
    rarity: { value: 6, code: 'TIER_6', label: '六星' },
  },
  {
    ...sampleOperators[0],
    operatorKey: 'fixed:char_tier5_ak',
    charId: 'char_tier5_ak',
    name: '阿',
    shop: {
      ...sampleOperators[0].shop,
      tier: { value: 5, label: 'V阶' },
    },
    rarity: { value: 6, code: 'TIER_6', label: '六星' },
  },
  {
    ...sampleOperators[1],
    operatorKey: 'fixed:char_tier5_siege',
    charId: 'char_tier5_siege',
    name: '推进之王',
    shop: {
      ...sampleOperators[1].shop,
      tier: { value: 5, label: 'V阶' },
    },
    rarity: { value: 5, code: 'TIER_5', label: '五星' },
  },
  {
    ...sampleOperators[1],
    operatorKey: 'fixed:char_tier6_high',
    charId: 'char_tier6_high',
    name: '维娜',
    shop: {
      ...sampleOperators[1].shop,
      tier: { value: 6, label: 'VI阶' },
    },
    rarity: { value: 6, code: 'TIER_6', label: '六星' },
  },
];

test('applyQuery filters by profession, bond, and trimmed name search', () => {
  const state = createQueryState(sampleOperators);
  const next = applyQuery(state, {
    searchText: '  能天使 ',
    professionCode: 'SNIPER',
    bondIds: ['lateranoShip', 'swiftShip'],
    tierValue: 5,
  });

  assert.deepEqual(next.visibleKeys, ['fixed:char_exusiai']);
});

test('applyQuery supports case-insensitive appellation search and subProfession filtering', () => {
  const state = createQueryState(sampleOperators);
  const next = applyQuery(state, {
    searchText: 'EXUSIAI',
    subProfessionCode: 'fastshot',
  });

  assert.deepEqual(next.visibleKeys, ['fixed:char_exusiai']);
});

test('selection stays stable when the selected operator still matches', () => {
  const state = createQueryState(sampleOperators, { selectedOperatorKey: 'fixed:char_exusiai' });
  const next = applyQuery(state, { searchText: '能天' });

  assert.equal(next.selectedOperatorKey, 'fixed:char_exusiai');
});

test('filter option order, all-option placement, and empty fallback stay deterministic', () => {
  const state = createQueryState(sampleOperators);

  assert.deepEqual(state.visibleKeys, [
    'fixed:char_nearl',
    'fixed:char_exusiai',
    'fixed:char_harold',
    'fixed:char_ines',
    'diy:char_touch',
  ]);
  assert.equal(state.selectedOperatorKey, 'fixed:char_nearl');
  assert.deepEqual(state.filterOptions.professions.map((item) => item.label), ['全部', '近卫', '狙击', '先锋', '医疗']);
  assert.deepEqual(state.filterOptions.subProfessions.map((item) => item.label), ['全部', '情报官', '速射手', '无畏者', '行医', '医师']);
  assert.equal(state.filterOptions.tiers[0].label, '全部');
  assert.deepEqual(state.filterOptions.tiers.slice(1).map((item) => item.value), [0, 1, 2, 5, 6]);
  assert.deepEqual(state.filterOptions.bondGroups.map((item) => item.label), ['核心盟约', '附加盟约']);
  assert.deepEqual(state.filterOptions.bondGroups[0].items.map((item) => item.name), ['哥伦比亚', '卡西米尔', '拉特兰', '维多利亚']);
  assert.deepEqual(state.filterOptions.bondGroups[1].items.map((item) => item.name), ['坚守', '突袭', '协防干员', '迅捷']);
  assert.deepEqual(state.filterOptions.bondGroups[0].items[0], {
    value: 'columbiaShip',
    name: '哥伦比亚',
    label: '哥伦比亚',
    iconId: 'icon_columbiaShip',
  });
  assert.deepEqual(state.filterOptions.bondGroups[1].items[2], {
    value: 'emptyShip',
    name: '协防干员',
    label: '协防干员',
    iconId: 'icon_emptyShip',
  });
  assert.deepEqual(
    state.filterOptions.garrisonTriggerTimings.map((item) => item.value).filter(Boolean).sort(),
    ['休整期结束时', '常驻/被动', '战斗开始时', '获得时'].sort(),
  );

  const next = applyQuery(state, { professionCode: 'MEDIC' });
  assert.equal(next.selectedOperatorKey, next.visibleKeys[0] ?? null);

  const empty = applyQuery(state, { searchText: 'no-match' });
  assert.deepEqual(empty.visibleKeys, []);
  assert.equal(empty.selectedOperatorKey, null);
});

test('bond multi-select uses intersection matching and supports clearing', () => {
  const state = createQueryState(sampleOperators);

  const combo = applyQuery(state, { bondIds: ['lateranoShip', 'swiftShip'] });
  assert.deepEqual(combo.visibleKeys, ['fixed:char_exusiai']);

  const impossible = applyQuery(state, { bondIds: ['lateranoShip', 'raidShip'] });
  assert.deepEqual(impossible.visibleKeys, []);

  const cleared = applyQuery(combo, { bondIds: [] });
  assert.deepEqual(cleared.visibleKeys, state.visibleKeys);
});

test('query list sorting uses shop tier desc, rarity desc, then name asc', () => {
  const state = createQueryState([
    ...sampleOperatorsWithSortTieCases,
    sampleOperators[4],
  ]);

  assert.deepEqual(state.visibleKeys, [
    'fixed:char_tier6_high',
    'fixed:char_tier5_ak',
    'fixed:char_tier5_exusiai',
    'fixed:char_tier5_siege',
    'diy:char_touch',
  ]);
});

test('tier filter can target tierless DIY records without colliding with fixed tiers', () => {
  const state = createQueryState(sampleOperators, { selectedOperatorKey: 'diy:char_touch' });
  const next = applyQuery(state, { tierValue: 0 });

  assert.deepEqual(next.visibleKeys, ['diy:char_touch']);
  assert.equal(next.selectedOperatorKey, 'diy:char_touch');
  assert.equal(next.selectedOperator?.source.kind, 'diy');
});

test('garrison trigger timing filter excludes operators without matching traits and removes traitless diy operators', () => {
  const state = createQueryState(sampleOperators, { selectedOperatorKey: 'diy:char_touch' });

  const onAcquire = applyQuery(state, { garrisonTriggerTiming: '获得时' });
  assert.deepEqual(onAcquire.visibleKeys, ['fixed:char_harold']);

  const passive = applyQuery(state, { garrisonTriggerTiming: '常驻/被动' });
  assert.deepEqual(passive.visibleKeys, ['fixed:char_nearl', 'fixed:char_exusiai']);
  assert.equal(passive.visibleKeys.includes('diy:char_touch'), false);
});
