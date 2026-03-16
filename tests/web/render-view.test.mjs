import test from 'node:test';
import assert from 'node:assert/strict';
import { renderViewModel } from '../../web/render-view.mjs';

const sampleOperator = {
  operatorKey: 'fixed:char_103_exusiai',
  charId: 'char_103_exusiai',
  name: '能天使',
  appellation: 'Exusiai',
  source: { kind: 'fixed', label: '固定编队', isInferred: false },
  profession: { code: 'SNIPER', label: '狙击' },
  subProfession: { code: 'fastshot', label: '速射手' },
  rarity: { value: 6, code: 'TIER_6', label: '六星' },
  assets: {
    avatarId: 'char_103_exusiai',
    portraitId: 'char_103_exusiai_1',
    avatarPath: '/data/act2autochess/assets/operators/char_103_exusiai.png',
  },
  shop: {
    tier: { value: 5, label: 'V阶' },
    purchasePrice: 2,
    sellPrice: 1,
  },
  bonds: [
    { bondId: 'lateranoShip', name: '拉特兰', iconId: 'icon_lateranoShip', category: { key: 'core', label: '核心盟约' }, desc: '拉特兰说明' },
    { bondId: 'rhineShip', name: '莱茵生命', iconId: 'icon_rhineShip', category: { key: 'extra', label: '附加盟约' }, desc: '莱茵生命说明' },
  ],
  phases: [
    {
      key: 'base',
      label: '初始',
      chessId: 'chess_char_5_01_a',
      garrisons: [
        { garrisonId: 'garrison_23_a', garrisonDesc: '特质23' },
        { garrisonId: 'garrison_55_a', garrisonDesc: '特质55' },
      ],
    },
    {
      key: 'elite',
      label: '精锐',
      chessId: 'chess_char_5_01_b',
      garrisons: [
        { garrisonId: 'garrison_23_b', garrisonDesc: '精锐特质23' },
        { garrisonId: 'garrison_55_b', garrisonDesc: '精锐特质55' },
      ],
    },
  ],
};

const diyOperator = {
  operatorKey: 'diy:char_613_acmedc',
  charId: 'char_613_acmedc',
  name: 'Touch',
  appellation: 'Touch',
  source: { kind: 'diy', label: '自选编队', isInferred: true },
  profession: { code: 'MEDIC', label: '医疗' },
  subProfession: { code: 'physician', label: '行医' },
  rarity: { value: 6, code: 'TIER_6', label: '六星' },
  assets: {
    avatarId: 'char_613_acmedc',
    portraitId: 'char_613_acmedc_1',
    avatarPath: '/data/act2autochess/assets/operators/char_613_acmedc.png',
  },
  shop: {
    tier: { value: 0, label: '无阶级' },
    purchasePrice: 4,
    sellPrice: 1,
  },
  bonds: [
    { bondId: 'emptyShip', name: '协防干员', iconId: 'icon_emptyShip', category: { key: 'extra', label: '附加盟约' }, desc: '协防说明' },
  ],
  phases: [],
};

test('renderViewModel hides the left list on blocking error', () => {
  const view = renderViewModel({
    status: 'error',
    errorMessage: '数据未导出，请先运行导出脚本。',
    visibleOperators: [],
    selectedOperator: sampleOperator,
  });

  assert.equal(view.showCandidateList, false);
  assert.deepEqual(view.candidateItems, []);
  assert.equal(view.detailSummary, null);
  assert.deepEqual(view.bondRows, []);
  assert.deepEqual(view.phaseSections, []);
});

test('renderViewModel exposes the new phase-based detail fields in normal state', () => {
  const view = renderViewModel({
    status: 'ready',
    visibleOperators: [sampleOperator],
    selectedOperator: sampleOperator,
  });

  assert.equal(view.candidateItems[0].name, '能天使');
  assert.equal(view.candidateItems[0].professionLabel, '狙击');
  assert.equal(view.candidateItems[0].subProfessionLabel, '速射手');
  assert.equal(view.candidateItems[0].tierLabel, 'V阶');
  assert.equal(view.candidateItems[0].operatorKey, 'fixed:char_103_exusiai');
  assert.equal(view.candidateItems[0].sourceLabel, '固定编队');
  assert.equal(view.candidateItems[0].avatarUrl, '/data/act2autochess/assets/operators/char_103_exusiai.png');
  assert.equal(view.candidateItems[0].isSelected, true);
  assert.deepEqual(view.detailSummary, {
    name: '能天使',
    sourceKind: 'fixed',
    sourceLabel: '固定编队',
    professionLabel: '狙击',
    subProfessionLabel: '速射手',
    rarityLabel: '六星',
    tierLabel: 'V阶',
    purchasePrice: 2,
    sellPrice: 1,
    avatarId: 'char_103_exusiai',
    portraitId: 'char_103_exusiai_1',
    avatarUrl: '/data/act2autochess/assets/operators/char_103_exusiai.png',
    avatarFallbackUrls: [],
  });
  assert.deepEqual(view.bondRows.map((item) => item.name), ['拉特兰', '莱茵生命']);
  assert.deepEqual(view.phaseSections, [
    {
      key: 'base',
      label: '初始',
      garrisonRows: [
        { garrisonId: 'garrison_23_a', garrisonDesc: '特质23' },
        { garrisonId: 'garrison_55_a', garrisonDesc: '特质55' },
      ],
    },
    {
      key: 'elite',
      label: '精锐',
      garrisonRows: [
        { garrisonId: 'garrison_23_b', garrisonDesc: '精锐特质23' },
        { garrisonId: 'garrison_55_b', garrisonDesc: '精锐特质55' },
      ],
    },
  ]);
});

test('renderViewModel keeps DIY records readable when they are tierless and have no garrisons', () => {
  const view = renderViewModel({
    status: 'ready',
    visibleOperators: [diyOperator],
    selectedOperator: diyOperator,
  });

  assert.deepEqual(view.candidateItems, [
    {
      operatorKey: 'diy:char_613_acmedc',
      name: 'Touch',
      professionLabel: '医疗',
      subProfessionLabel: '行医',
      tierLabel: '无阶级',
      sourceLabel: '自选编队',
      avatarUrl: '/data/act2autochess/assets/operators/char_613_acmedc.png',
      avatarFallbackUrls: [],
      isSelected: true,
    },
  ]);
  assert.deepEqual(view.detailSummary, {
    name: 'Touch',
    sourceKind: 'diy',
    sourceLabel: '自选编队',
    professionLabel: '医疗',
    subProfessionLabel: '行医',
    rarityLabel: '六星',
    tierLabel: '无阶级',
    purchasePrice: 4,
    sellPrice: 1,
    avatarId: 'char_613_acmedc',
    portraitId: 'char_613_acmedc_1',
    avatarUrl: '/data/act2autochess/assets/operators/char_613_acmedc.png',
    avatarFallbackUrls: [],
  });
  assert.deepEqual(view.bondRows, [
    { bondId: 'emptyShip', name: '协防干员', iconId: 'icon_emptyShip', category: { key: 'extra', label: '附加盟约' }, desc: '协防说明' },
  ]);
  assert.deepEqual(view.phaseSections, []);
});
