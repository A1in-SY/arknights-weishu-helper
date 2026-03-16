import test from 'node:test';
import assert from 'node:assert/strict';
import { validateExportResult } from '../../src/export/validate-export-result.mjs';

function makeValidResult() {
  const fixedOperator = {
    operatorKey: 'fixed:chess_char_1_01_a',
    charId: 'char_498_inside',
    name: '隐现',
    appellation: 'Insider',
    source: { kind: 'fixed', label: '固定编队', isInferred: false },
    profession: { code: 'SNIPER', label: '狙击' },
    subProfession: { code: 'fastshot', label: '速射手' },
    rarity: { value: 5, code: 'TIER_5', label: '五星' },
    assets: {
      avatarId: 'char_498_inside',
      portraitId: 'char_498_inside_1',
      avatarPath: '/data/act2autochess/assets/operators/char_498_inside.png',
    },
    shop: {
      tier: { value: 1, label: 'I阶' },
      purchasePrice: 1,
      sellPrice: 0,
    },
    bonds: [{
      bondId: 'lateranoShip',
      name: '拉特兰',
      iconId: 'icon_lateranoShip',
      category: { key: 'core', label: '核心盟约' },
      desc: 'desc',
    }],
    phases: [
      {
        key: 'base',
        label: '初始',
        chessId: 'chess_char_1_01_a',
        garrisons: [{ garrisonId: 'garrison_16_a', garrisonDesc: 'desc', triggerTimings: ['常驻/被动'] }],
      },
      {
        key: 'elite',
        label: '精锐',
        chessId: 'chess_char_1_01_b',
        garrisons: [{ garrisonId: 'garrison_16_b', garrisonDesc: 'desc', triggerTimings: ['常驻/被动'] }],
      },
    ],
  };

  const diyOperator = {
    operatorKey: 'diy:char_900_000',
    charId: 'char_900_000',
    name: '测试 DIY',
    appellation: 'DIY',
    source: { kind: 'diy', label: '自选编队', isInferred: true },
    profession: { code: 'MEDIC', label: '医疗' },
    subProfession: { code: 'physician', label: '医师' },
    rarity: { value: 6, code: 'TIER_6', label: '六星' },
    assets: {
      avatarId: 'char_900_000',
      portraitId: 'char_900_000_1',
      avatarPath: '/data/act2autochess/assets/operators/char_900_000.png',
    },
    shop: {
      tier: { value: 0, label: '无阶级' },
      purchasePrice: 4,
      sellPrice: 1,
    },
    bonds: [{
      bondId: 'emptyShip',
      name: '协防干员',
      iconId: 'icon_emptyShip',
      category: { key: 'extra', label: '附加盟约' },
      desc: 'desc',
    }],
    phases: [],
  };

  const fixedOperators = Array.from({ length: 116 }, (_, index) => ({
    ...fixedOperator,
    operatorKey: `fixed:chess_${String(index).padStart(3, '0')}_a`,
    charId: `char_fixed_${String(index).padStart(3, '0')}`,
    phases: [
      {
        key: 'base',
        label: '初始',
        chessId: `chess_${String(index).padStart(3, '0')}_a`,
        garrisons: [{ garrisonId: `garrison_${index}_a`, garrisonDesc: 'desc', triggerTimings: ['常驻/被动'] }],
      },
      {
        key: 'elite',
        label: '精锐',
        chessId: `chess_${String(index).padStart(3, '0')}_b`,
        garrisons: [{ garrisonId: `garrison_${index}_b`, garrisonDesc: 'desc', triggerTimings: ['常驻/被动'] }],
      },
    ],
  }));

  const diyOperators = Array.from({ length: 81 }, (_, index) => ({
    ...diyOperator,
    operatorKey: `diy:char_diy_${String(index).padStart(3, '0')}`,
    charId: `char_diy_${String(index).padStart(3, '0')}`,
  }));

  return {
    activityId: 'act2autochess',
    count: 197,
    bonds: Array.from({ length: 23 }, (_, index) => ({
      bondId: `bond_${index}`,
      name: `盟约${index}`,
      iconId: `icon_bond_${index}`,
      identifier: index + 1,
      category: { key: index < 8 ? 'core' : 'extra', label: index < 8 ? '核心盟约' : '附加盟约' },
      desc: 'desc',
      activationThreshold: 2,
      activationType: 'BATTLE',
      activationCondition: 'BOARD',
    })),
    strategies: Array.from({ length: 36 }, (_, index) => ({
      strategyId: `band_${index}`,
      name: `策略${index}`,
      iconId: `icon_strategy_${index}`,
      iconPath: `/data/act2autochess/assets/strategies/band_${index}.png`,
      totalHp: 30,
      unlockDesc: null,
      effectId: `aceffect_band_${index}`,
      effectName: `效果${index}`,
      effectDesc: '第一行\n第二行',
    })),
    operators: [...fixedOperators, ...diyOperators],
    report: {
      activityId: 'act2autochess',
      bondCount: 23,
      strategyCount: 36,
      fixedOperatorCount: 116,
      diyCandidateCharCount: 81,
      diyOperatorCount: 81,
      exportedCount: 197,
      diySlotChessIds: [
        'chess_char_5_diy1_a',
        'chess_char_5_diy2_a',
        'chess_char_6_diy1_a',
        'chess_char_6_diy2_a',
      ],
      missingCharIdMappings: [],
      missingBondMappings: [],
      missingGarrisonMappings: [],
      duplicateChessIds: [],
      multiGarrisonChessIds: [
        'chess_char_2_05_a',
        'chess_char_2_12_a',
        'chess_char_3_17_a',
        'chess_char_5_01_a',
        'chess_char_5_21_a',
        'chess_char_6_07_a',
        'chess_char_6_12_a',
        'chess_char_6_17_a',
      ],
    },
  };
}

test('validateExportResult rejects missing required fields, mapping holes, and old-shape leftovers', () => {
  const missingField = makeValidResult();
  delete missingField.operators[0].profession.label;
  assert.throws(() => validateExportResult(missingField), /profession\.label/);

  const missingBondField = makeValidResult();
  delete missingBondField.bonds[0].activationThreshold;
  assert.throws(() => validateExportResult(missingBondField), /activationThreshold/);

  const missingStrategyField = makeValidResult();
  delete missingStrategyField.strategies[0].effectDesc;
  assert.throws(() => validateExportResult(missingStrategyField), /effectDesc/);

  const missingBondMapping = makeValidResult();
  missingBondMapping.report.missingBondMappings = ['bond_x'];
  assert.throws(() => validateExportResult(missingBondMapping), /missingBondMappings/);

  const missingGarrisonMapping = makeValidResult();
  missingGarrisonMapping.report.missingGarrisonMappings = ['garrison_x'];
  assert.throws(() => validateExportResult(missingGarrisonMapping), /missingGarrisonMappings/);

  const missingPhases = makeValidResult();
  delete missingPhases.operators[0].phases;
  assert.throws(() => validateExportResult(missingPhases), /phases/);

  const legacyShape = makeValidResult();
  legacyShape.operators[0].upgrade = { chessId: 'legacy' };
  assert.throws(() => validateExportResult(legacyShape), /legacy field|upgrade/);
});

test('validateExportResult rejects duplicate ids, wrong counts, and broken phase arrays', () => {
  const duplicate = makeValidResult();
  duplicate.report.duplicateChessIds = ['chess_000_a'];
  assert.throws(() => validateExportResult(duplicate), /duplicateChessIds/);

  const wrongCount = makeValidResult();
  wrongCount.count = 115;
  assert.throws(() => validateExportResult(wrongCount), /197/);

  const brokenBondCategory = makeValidResult();
  brokenBondCategory.operators[0].bonds[0].category.key = 'bad';
  assert.throws(() => validateExportResult(brokenBondCategory), /bond category\.key|bond category/);

  const wrongDiySlots = makeValidResult();
  wrongDiySlots.report.diySlotChessIds = ['wrong'];
  assert.throws(() => validateExportResult(wrongDiySlots), /diySlotChessIds/);

  const wrongPhases = makeValidResult();
  delete wrongPhases.operators[0].phases[1].garrisons[0].garrisonDesc;
  assert.throws(() => validateExportResult(wrongPhases), /phase 1 garrisons garrisonDesc|garrisonDesc/);

  const wrongTriggerTimings = makeValidResult();
  delete wrongTriggerTimings.operators[0].phases[1].garrisons[0].triggerTimings;
  assert.throws(() => validateExportResult(wrongTriggerTimings), /triggerTimings/);

  const duplicateRecordKey = makeValidResult();
  duplicateRecordKey.operators[1].operatorKey = duplicateRecordKey.operators[0].operatorKey;
  assert.throws(() => validateExportResult(duplicateRecordKey), /operatorKey/);
});
