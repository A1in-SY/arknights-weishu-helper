const REQUIRED_OPERATOR_PATHS = [
  'operatorKey',
  'charId',
  'name',
  'appellation',
  'source.kind',
  'source.label',
  'source.isInferred',
  'profession.code',
  'profession.label',
  'subProfession.code',
  'subProfession.label',
  'rarity.value',
  'rarity.code',
  'rarity.label',
  'assets.avatarId',
  'assets.portraitId',
  'assets.avatarPath',
  'shop.tier.value',
  'shop.tier.label',
  'shop.purchasePrice',
  'shop.sellPrice',
  'bonds',
  'phases',
];

const REQUIRED_BOND_PATHS = [
  'bondId',
  'name',
  'iconId',
  'identifier',
  'category.key',
  'category.label',
  'desc',
  'activationThreshold',
  'activationType',
  'activationCondition',
];

const REQUIRED_STRATEGY_PATHS = [
  'strategyId',
  'name',
  'iconId',
  'iconPath',
  'totalHp',
  'effectId',
  'effectName',
  'effectDesc',
];

const EXPECTED_DIY_SLOT_CHESS_IDS = [
  'chess_char_5_diy1_a',
  'chess_char_5_diy2_a',
  'chess_char_6_diy1_a',
  'chess_char_6_diy2_a',
];

function getPathValue(record, path) {
  return path.split('.').reduce((value, key) => value?.[key], record);
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateGarrisons(garrisons, label) {
  assertCondition(Array.isArray(garrisons), `${label} must be an array`);

  for (const garrison of garrisons) {
    assertCondition(typeof garrison.garrisonId === 'string' && garrison.garrisonId.length > 0, `${label} garrisonId must be a non-empty string`);
    assertCondition(typeof garrison.garrisonDesc === 'string' && garrison.garrisonDesc.length > 0, `${label} garrisonDesc must be a non-empty string`);
    assertCondition(Array.isArray(garrison.triggerTimings) && garrison.triggerTimings.length > 0, `${label} triggerTimings must be a non-empty array`);
    assertCondition(garrison.triggerTimings.every((item) => typeof item === 'string' && item.length > 0), `${label} triggerTimings items must be non-empty strings`);
  }
}

function validatePhase(phase, index) {
  assertCondition(phase && typeof phase === 'object', `phase ${index} must be an object`);
  assertCondition(typeof phase.key === 'string' && phase.key.length > 0, `phase ${index} key must be a non-empty string`);
  assertCondition(typeof phase.label === 'string' && phase.label.length > 0, `phase ${index} label must be a non-empty string`);
  assertCondition(
    phase.chessId === null || (typeof phase.chessId === 'string' && phase.chessId.length > 0),
    `phase ${index} chessId must be null or a non-empty string`,
  );
  validateGarrisons(phase.garrisons, `phase ${index} garrisons`);
}

function validateOperatorRecord(operator) {
  for (const path of REQUIRED_OPERATOR_PATHS) {
    const value = getPathValue(operator, path);

    assertCondition(value !== undefined && value !== null, `Missing required field: ${path}`);
    if (typeof value === 'string') {
      assertCondition(value.length > 0, `Empty required field: ${path}`);
    }
  }

  assertCondition(!('chessId' in operator), 'legacy field not allowed: chessId');
  assertCondition(!('tier' in operator), 'legacy field not allowed: tier');
  assertCondition(!('purchasePrice' in operator), 'legacy field not allowed: purchasePrice');
  assertCondition(!('sellPrice' in operator), 'legacy field not allowed: sellPrice');
  assertCondition(!('bondIds' in operator), 'legacy field not allowed: bondIds');
  assertCondition(!('garrisonIds' in operator), 'legacy field not allowed: garrisonIds');
  assertCondition(!('garrisons' in operator), 'legacy field not allowed: garrisons');
  assertCondition(!('upgrade' in operator), 'legacy field not allowed: upgrade');

  assertCondition(Array.isArray(operator.bonds), 'bonds must be an array');
  for (const bond of operator.bonds) {
    assertCondition(typeof bond.bondId === 'string' && bond.bondId.length > 0, 'bondId must be a non-empty string');
    assertCondition(typeof bond.name === 'string' && bond.name.length > 0, 'bond name must be a non-empty string');
    assertCondition(typeof bond.desc === 'string' && bond.desc.length > 0, 'bond desc must be a non-empty string');
    assertCondition(typeof bond.iconId === 'string' && bond.iconId.length > 0, 'bond iconId must be a non-empty string');
    assertCondition(bond.category?.key === 'core' || bond.category?.key === 'extra', 'bond category.key must be core or extra');
    assertCondition(typeof bond.category?.label === 'string' && bond.category.label.length > 0, 'bond category.label must be a non-empty string');
    assertCondition(!bond.desc.includes('<@') && !bond.desc.includes('</>'), 'bond desc must not contain client markup');
  }

  assertCondition(Array.isArray(operator.phases), 'phases must be an array');
  operator.phases.forEach(validatePhase);
  for (const phase of operator.phases) {
    for (const garrison of phase.garrisons) {
      assertCondition(!garrison.garrisonDesc.includes('<@') && !garrison.garrisonDesc.includes('</>'), 'garrison desc must not contain client markup');
    }
  }

  if (operator.source.kind === 'fixed') {
    assertCondition(operator.source.isInferred === false, 'fixed operator must not be inferred');
    assertCondition(operator.bonds.length > 0, 'fixed operator must keep bond data');
    assertCondition(operator.phases.length === 2, 'fixed operator phases length must be 2');
    assertCondition(operator.phases[0].key === 'base', 'fixed phase 0 key must be base');
    assertCondition(operator.phases[1].key === 'elite', 'fixed phase 1 key must be elite');
    assertCondition(operator.phases.every((phase) => typeof phase.chessId === 'string'), 'fixed operator phases must retain chessId');
  }

  if (operator.source.kind === 'diy') {
    assertCondition(operator.source.isInferred === true, 'DIY operator must be marked inferred');
    assertCondition(operator.shop.tier.value === 0, 'DIY operator tier must be the tierless sentinel');
    assertCondition(operator.bonds.length > 0, 'DIY operator must keep inferred bond data');
    assertCondition(operator.phases.length === 0, 'DIY operator phases must be empty');
  }
}

function validateBondDefinition(bond) {
  for (const path of REQUIRED_BOND_PATHS) {
    const value = getPathValue(bond, path);

    assertCondition(value !== undefined && value !== null, `Missing bond field: ${path}`);
    if (typeof value === 'string') {
      assertCondition(value.length > 0, `Empty bond field: ${path}`);
    }
  }

  assertCondition(bond.category.key === 'core' || bond.category.key === 'extra', 'bond definition category.key must be core or extra');
  assertCondition(Number.isInteger(bond.activationThreshold) && bond.activationThreshold > 0, 'bond activationThreshold must be a positive integer');
}

function validateStrategyDefinition(strategy) {
  for (const path of REQUIRED_STRATEGY_PATHS) {
    const value = getPathValue(strategy, path);

    assertCondition(value !== undefined && value !== null, `Missing strategy field: ${path}`);
    if (typeof value === 'string') {
      assertCondition(value.length > 0, `Empty strategy field: ${path}`);
    }
  }

  assertCondition(Number.isInteger(strategy.totalHp) && strategy.totalHp > 0, 'strategy totalHp must be a positive integer');
}

export function validateExportResult(result) {
  assertCondition(result.activityId === 'act2autochess', 'Invalid activityId');
  assertCondition(result.count === 197, 'Expected exactly 197 operators');
  assertCondition(Array.isArray(result.bonds), 'bonds must be an array');
  assertCondition(result.bonds.length === 23, 'bonds length must be 23');
  assertCondition(Array.isArray(result.strategies), 'strategies must be an array');
  assertCondition(result.strategies.length === 36, 'strategies length must be 36');
  assertCondition(Array.isArray(result.operators), 'operators must be an array');
  assertCondition(result.operators.length === 197, 'operators length must be 197');
  assertCondition(result.report?.activityId === 'act2autochess', 'Invalid report activityId');
  assertCondition(result.report?.bondCount === 23, 'bondCount must be 23');
  assertCondition(result.report?.strategyCount === 36, 'strategyCount must be 36');
  assertCondition(result.report?.fixedOperatorCount === 116, 'fixedOperatorCount must be 116');
  assertCondition(result.report?.diyCandidateCharCount === 81, 'diyCandidateCharCount must be 81');
  assertCondition(result.report?.diyOperatorCount === 81, 'diyOperatorCount must be 81');
  assertCondition(result.report?.exportedCount === 197, 'exportedCount must be 197');
  assertCondition(Array.isArray(result.report?.missingCharIdMappings), 'missingCharIdMappings must be an array');
  assertCondition(Array.isArray(result.report?.missingBondMappings), 'missingBondMappings must be an array');
  assertCondition(Array.isArray(result.report?.missingGarrisonMappings), 'missingGarrisonMappings must be an array');
  assertCondition(Array.isArray(result.report?.duplicateChessIds), 'duplicateChessIds must be an array');
  assertCondition(Array.isArray(result.report?.diySlotChessIds), 'diySlotChessIds must be an array');
  assertCondition(Array.isArray(result.report?.multiGarrisonChessIds), 'multiGarrisonChessIds must be an array');
  assertCondition(result.report.missingCharIdMappings.length === 0, 'missingCharIdMappings must be empty');
  assertCondition(result.report.missingBondMappings.length === 0, 'missingBondMappings must be empty');
  assertCondition(result.report.missingGarrisonMappings.length === 0, 'missingGarrisonMappings must be empty');
  assertCondition(result.report.duplicateChessIds.length === 0, 'duplicateChessIds must be empty');
  assertCondition(
    JSON.stringify(result.report.diySlotChessIds) === JSON.stringify(EXPECTED_DIY_SLOT_CHESS_IDS),
    'diySlotChessIds must match the fixed DIY slot list',
  );

  const seenBondIds = new Set();
  for (const bond of result.bonds) {
    validateBondDefinition(bond);
    assertCondition(!seenBondIds.has(bond.bondId), `Duplicate bondId: ${bond.bondId}`);
    seenBondIds.add(bond.bondId);
  }

  const seenStrategyIds = new Set();
  for (const strategy of result.strategies) {
    validateStrategyDefinition(strategy);
    assertCondition(!seenStrategyIds.has(strategy.strategyId), `Duplicate strategyId: ${strategy.strategyId}`);
    seenStrategyIds.add(strategy.strategyId);
  }

  const seenOperatorKeys = new Set();
  const seenBaseChessIds = new Set();
  const charIdKinds = new Map();
  const fixedOperators = [];
  const diyOperators = [];
  for (const operator of result.operators) {
    validateOperatorRecord(operator);
    assertCondition(!seenOperatorKeys.has(operator.operatorKey), `Duplicate operatorKey: ${operator.operatorKey}`);
    seenOperatorKeys.add(operator.operatorKey);

    if (!charIdKinds.has(operator.charId)) {
      charIdKinds.set(operator.charId, new Set());
    }
    charIdKinds.get(operator.charId).add(operator.source.kind);

    if (operator.source.kind === 'fixed') {
      fixedOperators.push(operator);
    } else {
      diyOperators.push(operator);
    }

    const baseChessId = operator.phases[0]?.chessId;
    if (typeof baseChessId === 'string') {
      assertCondition(!seenBaseChessIds.has(baseChessId), `Duplicate base chessId: ${baseChessId}`);
      seenBaseChessIds.add(baseChessId);
    }
  }

  for (const [charId, kinds] of charIdKinds.entries()) {
    if (kinds.size > 1) {
      assertCondition(!kinds.has('fixed'), `Fixed operator must not share charId with DIY record: ${charId}`);
    }
  }

  assertCondition(fixedOperators.length === 116, 'fixed source count must be 116');
  assertCondition(diyOperators.length === 81, 'diy source count must be 81');

  const diyByCharId = new Map();
  for (const operator of diyOperators) {
    assertCondition(operator.rarity.value === 6, `DIY operator must be six-star: ${operator.operatorKey}`);
    assertCondition(operator.shop.tier.value === 0, `DIY operator must stay tierless: ${operator.operatorKey}`);
    assertCondition(!diyByCharId.has(operator.charId), `DIY charId must stay unique: ${operator.charId}`);
    diyByCharId.set(operator.charId, operator);
  }

  assertCondition(diyByCharId.size === 81, 'DIY unique charId count must be 81');
}
