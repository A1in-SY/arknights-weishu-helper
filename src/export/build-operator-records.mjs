import { cleanDisplayText } from './clean-display-text.mjs';

const PASSIVE_TRIGGER_TIMING = '常驻/被动';

function mustGet(record, key, label) {
  const value = record?.[key];

  if (value === undefined || value === null) {
    throw new Error(`Missing ${label}: ${key}`);
  }

  return value;
}

function mustGetLabel(record, key, label) {
  const value = record?.[key];

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing ${label} label: ${key}`);
  }

  return value;
}

function buildTier(chessLevel) {
  const labels = {
    0: '无阶级',
    1: 'I阶',
    2: 'II阶',
    3: 'III阶',
    4: 'IV阶',
    5: 'V阶',
    6: 'VI阶',
  };

  const label = labels[chessLevel];

  if (!label) {
    throw new Error(`Unsupported chess level: ${chessLevel}`);
  }

  return { value: chessLevel, label };
}

function buildRarity(rarityCode, rarityLabels) {
  const label = mustGetLabel(rarityLabels, rarityCode, 'rarity');
  const value = Number(String(rarityCode).replace('TIER_', ''));

  if (!Number.isInteger(value)) {
    throw new Error(`Unsupported rarity code: ${rarityCode}`);
  }

  return {
    value,
    code: rarityCode,
    label,
  };
}

function buildOperatorAvatarPath(charId) {
  return `/data/act2autochess/assets/operators/${encodeURIComponent(charId)}.png`;
}

function buildStrategyIconPath(strategyId) {
  return `/data/act2autochess/assets/strategies/${encodeURIComponent(strategyId)}.png`;
}

function compareByBaseChessId(left, right) {
  return left.phases[0].chessId.localeCompare(right.phases[0].chessId);
}

function compareByDiyKey(left, right) {
  return left.charId.localeCompare(right.charId);
}

function mustBeArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`Expected array: ${label}`);
  }

  return [...value];
}

function extractTriggerTimings(rawDescription) {
  const description = String(rawDescription ?? '');
  const leadingMatch = description.match(/^(?:\s*<([^<>@/][^<>]*)>)+/);

  if (!leadingMatch) {
    return [PASSIVE_TRIGGER_TIMING];
  }

  const timings = [...leadingMatch[0].matchAll(/<([^<>@/][^<>]*)>/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);

  return timings.length > 0 ? [...new Set(timings)] : [PASSIVE_TRIGGER_TIMING];
}

function buildGarrisons(activity, chessId, missingGarrisonMappings) {
  const garrisonIds = mustBeArray(activity.charChessDataDict?.[chessId]?.garrisonIds, `garrisonIds for ${chessId}`);

  return garrisonIds.flatMap((garrisonId) => {
    const garrison = activity.garrisonDataDict?.[garrisonId];

    if (!garrison) {
      missingGarrisonMappings.push(garrisonId);
      return [];
    }

    return [{
        garrisonId,
        garrisonDesc: mustGet(garrison, 'garrisonDesc', 'garrison.garrisonDesc'),
        triggerTimings: extractTriggerTimings(mustGet(garrison, 'garrisonDesc', 'garrison.garrisonDesc')),
      }];
  });
}

function buildPhase(activity, phaseConfig, missingGarrisonMappings) {
  return {
    key: phaseConfig.key,
    label: phaseConfig.label,
    chessId: phaseConfig.chessId,
    garrisons: buildGarrisons(activity, phaseConfig.chessId, missingGarrisonMappings).map((garrison) => ({
      ...garrison,
      garrisonDesc: cleanDisplayText(garrison.garrisonDesc),
    })),
  };
}

function buildDefaultSkinLookup(skins) {
  const lookup = {};

  for (const skin of Object.values(skins ?? {})) {
    if (typeof skin?.charId !== 'string' || !skin.skinId?.endsWith('#1')) {
      continue;
    }

    if (!lookup[skin.charId]) {
      lookup[skin.charId] = skin;
    }
  }

  return lookup;
}

function buildBondCategory(bond) {
  if (bond.identifier <= 8) {
    return { key: 'core', label: '核心盟约' };
  }

  return { key: 'extra', label: '附加盟约' };
}

function buildBondEntries(activity, bondIds, missingBondMappings) {
  return bondIds.flatMap((bondId) => {
    const bond = activity.bondInfoDict?.[bondId];

    if (!bond) {
      missingBondMappings.push(bondId);
      return [];
    }

    return [{
      bondId,
      name: mustGet(bond, 'name', 'bond.name'),
      iconId: mustGet(bond, 'iconId', 'bond.iconId'),
      category: buildBondCategory(bond),
      desc: cleanDisplayText(mustGet(bond, 'desc', 'bond.desc')),
    }];
  });
}

function compareBonds(left, right) {
  return (
    left.identifier - right.identifier ||
    left.name.localeCompare(right.name, 'zh-Hans-CN') ||
    left.bondId.localeCompare(right.bondId)
  );
}

function buildBondDefinitions(activity) {
  return Object.values(activity.bondInfoDict ?? {})
    .map((bond) => ({
      bondId: mustGet(bond, 'bondId', 'bond.bondId'),
      name: mustGet(bond, 'name', 'bond.name'),
      iconId: mustGet(bond, 'iconId', 'bond.iconId'),
      identifier: mustGet(bond, 'identifier', 'bond.identifier'),
      category: buildBondCategory(bond),
      desc: cleanDisplayText(mustGet(bond, 'desc', 'bond.desc')),
      activationThreshold: mustGet(bond, 'activeCount', 'bond.activeCount'),
      activationType: mustGet(bond, 'activeType', 'bond.activeType'),
      activationCondition: mustGet(bond, 'activeCondition', 'bond.activeCondition'),
    }))
    .sort(compareBonds);
}

function compareStrategies(left, right) {
  return (
    left.sortId - right.sortId ||
    left.name.localeCompare(right.name, 'zh-Hans-CN') ||
    left.strategyId.localeCompare(right.strategyId)
  );
}

function buildStrategyDefinitions(activity, bandData) {
  return Object.values(activity.bandDataListDict ?? {})
    .map((band) => {
      const strategyId = mustGet(band, 'bandId', 'band.bandId');
      const strategyMeta = mustGet(bandData, strategyId, 'bandData');
      const effectId = mustGet(band, 'effectId', 'band.effectId');
      const effect = mustGet(activity.effectInfoDataDict, effectId, 'effectInfoDataDict');

      return {
        strategyId,
        name: mustGet(strategyMeta, 'bandName', 'bandData.bandName'),
        sortId: mustGet(band, 'sortId', 'band.sortId'),
        iconId: mustGet(strategyMeta, 'bandIconId', 'bandData.bandIconId'),
        iconPath: buildStrategyIconPath(strategyId),
        totalHp: mustGet(band, 'totalHp', 'band.totalHp'),
        unlockDesc: strategyMeta.unlockDesc ?? null,
        effectId,
        effectName: mustGet(effect, 'effectName', 'effect.effectName'),
        effectDesc: cleanDisplayText(mustGet(effect, 'effectDesc', 'effect.effectDesc')),
      };
    })
    .sort(compareStrategies)
    .map(({ sortId, ...strategy }) => strategy);
}

function buildSharedOperatorFields(character, defaultSkin, rarityLabels, professionLabels, subProfessionLabels) {
  const charId = mustGet(character, 'charId', 'character.charId');

  return {
    charId,
    name: mustGet(character, 'name', 'character.name'),
    appellation: mustGet(character, 'appellation', 'character.appellation'),
    profession: {
      code: mustGet(character, 'profession', 'character.profession'),
      label: mustGetLabel(professionLabels, character.profession, 'profession'),
    },
    subProfession: {
      code: mustGet(character, 'subProfessionId', 'character.subProfessionId'),
      label: mustGetLabel(subProfessionLabels, character.subProfessionId, 'subProfession'),
    },
    rarity: buildRarity(mustGet(character, 'rarity', 'character.rarity'), rarityLabels),
    assets: {
      avatarId: mustGet(defaultSkin, 'avatarId', 'defaultSkin.avatarId'),
      portraitId: mustGet(defaultSkin, 'portraitId', 'defaultSkin.portraitId'),
      avatarPath: buildOperatorAvatarPath(charId),
    },
  };
}

function buildShopInfo(activity, chessLevel) {
  const priceRow = mustGet(activity.shopCharChessInfoData, String(chessLevel), 'shopCharChessInfoData');
  const priceInfo = mustGet(priceRow, 0, 'shopCharChessInfoData[level][0]');

  return {
    tier: buildTier(chessLevel),
    purchasePrice: mustGet(priceInfo, 'purchasePrice', 'priceInfo.purchasePrice'),
    sellPrice: mustGet(priceInfo, 'chessSoldPrice', 'priceInfo.chessSoldPrice'),
  };
}

function buildDiyShopInfo(activity) {
  const tierFiveShop = buildShopInfo(activity, 5);

  return {
    ...tierFiveShop,
    tier: buildTier(0),
  };
}

function buildDiyCandidateCharacters(characters, fixedCharIds) {
  return Object.entries(characters ?? {})
    .filter(([charId, character]) => charId.startsWith('char_') && character?.rarity === 'TIER_6')
    .filter(([charId]) => !fixedCharIds.has(charId))
    .map(([charId, character]) => ({
      ...character,
      charId,
    }))
    .sort((left, right) => left.charId.localeCompare(right.charId));
}

function buildDiyBondIds(activity, diyBondMappings, charId) {
  const configuredBondIds = diyBondMappings?.coreBondIdsByCharId?.[charId];
  const defaultBondId = mustGet(diyBondMappings, 'defaultBondId', 'diyBondMappings.defaultBondId');
  const bondIds = configuredBondIds ?? [defaultBondId];

  return [...bondIds].sort((left, right) => {
    const leftIdentifier = mustGet(activity.bondInfoDict?.[left], 'identifier', 'bond.identifier');
    const rightIdentifier = mustGet(activity.bondInfoDict?.[right], 'identifier', 'bond.identifier');

    return leftIdentifier - rightIdentifier;
  });
}

export function buildOperatorRecords(source) {
  const {
    activity,
    bandData,
    characters,
    diyBondMappings,
    skins,
    displayMappings: {
      professionLabels,
      subProfessionLabels,
      rarityLabels,
    },
  } = source;

  const defaultSkinLookup = buildDefaultSkinLookup(skins);

  const rawATierEntries = Object.entries(activity.charShopChessDatas)
    .filter(([chessId]) => chessId.endsWith('_a'));

  const diySlotChessIds = rawATierEntries
    .filter(([, shopEntry]) => shopEntry.charId === null)
    .map(([chessId]) => chessId)
    .sort();

  const eligibleEntries = rawATierEntries
    .filter(([, shopEntry]) => shopEntry.charId !== null);

  const missingCharIdMappings = [];
  const missingBondMappings = [];
  const missingGarrisonMappings = [];
  const duplicateChessIds = [];
  const seenChessIds = new Set();

  const fixedOperators = eligibleEntries.map(([chessId, shopEntry]) => {
    if (seenChessIds.has(chessId)) {
      duplicateChessIds.push(chessId);
    }
    seenChessIds.add(chessId);

    const chess = activity.charChessDataDict?.[chessId];
    const character = characters?.[shopEntry.charId];

    if (!chess || !character) {
      missingCharIdMappings.push(chessId);
      return null;
    }

    const defaultSkin = mustGet(defaultSkinLookup, shopEntry.charId, 'default skin');
    const sharedFields = buildSharedOperatorFields(
      { ...character, charId: shopEntry.charId },
      defaultSkin,
      rarityLabels,
      professionLabels,
      subProfessionLabels,
    );
    const bondIds = mustBeArray(chess.bondIds, `bondIds for ${chessId}`);
    const upgradeChessId = mustGet(chess, 'upgradeChessId', 'chess.upgradeChessId');
    mustGet(activity.charChessDataDict, upgradeChessId, 'upgrade chess data');

    return {
      operatorKey: `fixed:${chessId}`,
      source: { kind: 'fixed', label: '固定编队', isInferred: false },
      ...sharedFields,
      shop: buildShopInfo(activity, mustGet(shopEntry, 'chessLevel', 'shopEntry.chessLevel')),
      bonds: buildBondEntries(activity, bondIds, missingBondMappings),
      phases: [
        buildPhase(activity, { key: 'base', label: '初始', chessId }, missingGarrisonMappings),
        buildPhase(activity, { key: 'elite', label: '精锐', chessId: upgradeChessId }, missingGarrisonMappings),
      ],
    };
  }).filter(Boolean).sort(compareByBaseChessId);

  const fixedCharIds = new Set(fixedOperators.map((operator) => operator.charId));
  const diyCandidateCharacters = buildDiyCandidateCharacters(characters, fixedCharIds);

  const diyOperators = diyCandidateCharacters
    .map((character) => {
      const defaultSkin = mustGet(defaultSkinLookup, character.charId, 'default skin');
      const sharedFields = buildSharedOperatorFields(
        character,
        defaultSkin,
        rarityLabels,
        professionLabels,
        subProfessionLabels,
      );
      const bondIds = buildDiyBondIds(activity, diyBondMappings, character.charId);

      return {
        operatorKey: `diy:${character.charId}`,
        source: { kind: 'diy', label: '自选编队', isInferred: true },
        ...sharedFields,
        shop: buildDiyShopInfo(activity),
        bonds: buildBondEntries(activity, bondIds, missingBondMappings),
        phases: [],
      };
    })
    .sort(compareByDiyKey);

  const operators = [...fixedOperators, ...diyOperators];

  const multiGarrisonChessIds = fixedOperators
    .filter((operator) => operator.phases[0].garrisons.length > 1)
    .map((operator) => operator.phases[0].chessId);
  const bonds = buildBondDefinitions(activity);
  const strategies = buildStrategyDefinitions(activity, bandData);

  const report = {
    activityId: 'act2autochess',
    bondCount: bonds.length,
    strategyCount: strategies.length,
    fixedOperatorCount: fixedOperators.length,
    diyCandidateCharCount: diyCandidateCharacters.length,
    diyOperatorCount: diyOperators.length,
    exportedCount: operators.length,
    diySlotChessIds,
    missingCharIdMappings,
    missingBondMappings,
    missingGarrisonMappings,
    duplicateChessIds,
    multiGarrisonChessIds,
  };

  return {
    activityId: 'act2autochess',
    count: operators.length,
    bonds,
    strategies,
    operators,
    report,
  };
}
