import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_FORMATION_SIZE,
  addFormation,
  addOperatorToFormation,
  buildFormationBondSummary,
  createFormationsState,
  getSelectedFormation,
  getSelectedFormationEntry,
  removeFormationEntry,
  setFormationStrategy,
  setFormationEntryTransferBond,
  updateFormation,
} from '../../web/formations-state.mjs';

const operators = [
  {
    operatorKey: 'fixed:char_exusiai',
    charId: 'char_exusiai',
    name: '能天使',
    bonds: [
      { bondId: 'lateranoShip', name: '拉特兰' },
      { bondId: 'swiftShip', name: '迅捷' },
    ],
  },
  {
    operatorKey: 'fixed:char_lemuen',
    charId: 'char_lemuen',
    name: '蕾缪安',
    bonds: [
      { bondId: 'lateranoShip', name: '拉特兰' },
    ],
  },
  {
    operatorKey: 'fixed:char_siege',
    charId: 'char_siege',
    name: '推进之王',
    bonds: [
      { bondId: 'victoriaShip', name: '维多利亚' },
    ],
  },
];

const bonds = [
  { bondId: 'lateranoShip', name: '拉特兰', identifier: 5, category: { key: 'core', label: '核心盟约' }, desc: 'desc', activationThreshold: 2 },
  { bondId: 'swiftShip', name: '迅捷', identifier: 10, category: { key: 'extra', label: '附加盟约' }, desc: 'desc', activationThreshold: 2 },
  { bondId: 'victoriaShip', name: '维多利亚', identifier: 3, category: { key: 'core', label: '核心盟约' }, desc: 'desc', activationThreshold: 3 },
];

const strategies = [
  { strategyId: 'band_duyaoy', name: '杜遥夜' },
  { strategyId: 'band_amiya', name: '阿米娅' },
];

function createIdFactory() {
  let index = 0;
  return () => `id-${++index}`;
}

test('createFormationsState starts with one editable formation by default', () => {
  const state = createFormationsState({ operators, bonds, strategies, idFactory: createIdFactory() });

  assert.equal(state.formations.length, 1);
  assert.equal(state.formations[0].name, '编队 1');
  assert.equal(state.formations[0].strategyId, null);
  assert.equal('selectedFormationId' in state, false);
  assert.equal('selectedEntryId' in state, false);
});

test('formation editing supports add, update, remove, and max size limit', () => {
  const idFactory = createIdFactory();
  let state = createFormationsState({ operators, bonds, strategies, idFactory });
  const formationId = state.formations[0].formationId;

  state = updateFormation(state, formationId, { name: '测试队', notes: '测试备注' });
  assert.equal(state.formations[0].name, '测试队');
  assert.equal(state.formations[0].notes, '测试备注');

  state = setFormationStrategy(state, { formationId, strategyId: 'band_duyaoy' });
  assert.equal(state.formations[0].strategyId, 'band_duyaoy');

  for (let index = 0; index < MAX_FORMATION_SIZE + 1; index += 1) {
    state = addOperatorToFormation(state, { formationId, operatorKey: 'fixed:char_exusiai', idFactory });
  }

  assert.equal(state.formations[0].entries.length, MAX_FORMATION_SIZE);
  assert.equal(state.formations[0].entries.every((entry) => entry.operatorKey === 'fixed:char_exusiai'), true);

  const entryId = state.formations[0].entries[0].entryId;
  state = removeFormationEntry(state, { formationId, entryId });
  assert.equal(state.formations[0].entries.length, MAX_FORMATION_SIZE - 1);
});

test('buildFormationBondSummary deduplicates same char, respects transfer bond, and splits satisfied/unmet bonds', () => {
  const idFactory = createIdFactory();
  let state = createFormationsState({ operators, bonds, strategies, idFactory });
  const formationId = state.formations[0].formationId;

  state = addOperatorToFormation(state, { formationId, operatorKey: 'fixed:char_exusiai', idFactory });
  state = addOperatorToFormation(state, { formationId, operatorKey: 'fixed:char_exusiai', idFactory });
  state = addOperatorToFormation(state, { formationId, operatorKey: 'fixed:char_lemuen', idFactory });
  state = addOperatorToFormation(state, { formationId, operatorKey: 'fixed:char_siege', idFactory });

  const siegeEntryId = state.formations[0].entries.at(-1).entryId;
  state = setFormationEntryTransferBond(state, { formationId, entryId: siegeEntryId, transferredBondId: 'lateranoShip' });

  const summary = buildFormationBondSummary({
    formation: state.formations[0],
    operators,
    bonds,
  });

  assert.equal(summary.requiresPersonnelDocument, false);
  assert.deepEqual(summary.satisfiedBonds.map((item) => `${item.bondId}:${item.currentCount}/${item.activationThreshold}`), [
    'lateranoShip:3/2',
  ]);
  assert.deepEqual(summary.unsatisfiedBonds.map((item) => `${item.bondId}:${item.currentCount}/${item.activationThreshold}`), [
    'victoriaShip:1/3',
    'swiftShip:1/2',
  ]);
});

test('buildFormationBondSummary marks a full formation as needing personnel document', () => {
  const idFactory = createIdFactory();
  let state = createFormationsState({ operators, bonds, strategies, idFactory });
  const formationId = state.formations[0].formationId;

  for (let index = 0; index < MAX_FORMATION_SIZE; index += 1) {
    state = addOperatorToFormation(state, { formationId, operatorKey: 'fixed:char_exusiai', idFactory });
  }

  const summary = buildFormationBondSummary({
    formation: state.formations[0],
    operators,
    bonds,
  });

  assert.equal(summary.requiresPersonnelDocument, true);
});

test('addFormation appends a new formation and selects it', () => {
  const idFactory = createIdFactory();
  const state = addFormation(
    createFormationsState({ operators, bonds, strategies, idFactory }),
    { idFactory },
  );

  assert.equal(state.formations.length, 2);
  assert.equal(state.formations[1].name, '编队 2');
  assert.equal('selectedFormationId' in state, false);
  assert.equal('selectedEntryId' in state, false);
});

test('formation selectors require explicit selected ids instead of reading runtime state', () => {
  const state = createFormationsState({ operators, bonds, strategies, idFactory: createIdFactory() });
  const formationId = state.formations[0].formationId;
  const withEntry = addOperatorToFormation(state, {
    formationId,
    operatorKey: 'fixed:char_exusiai',
    idFactory: createIdFactory(),
  });
  const entryId = withEntry.formations[0].entries[0].entryId;

  assert.equal(getSelectedFormation(withEntry), null);
  assert.equal(
    getSelectedFormation(withEntry, formationId)?.formationId,
    formationId,
  );
  assert.equal(getSelectedFormationEntry(withEntry, { selectedFormationId: formationId, selectedEntryId: entryId })?.entryId, entryId);
});
