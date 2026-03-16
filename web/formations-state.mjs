export const MAX_FORMATION_SIZE = 9;
export const FORMATIONS_STORAGE_KEY = 'act2autochess.formations.v1';

function defaultIdFactory() {
  return globalThis.crypto?.randomUUID?.() ?? `formation-${Date.now()}-${Math.random()}`;
}

function asOperatorLookup(operators) {
  return operators instanceof Map
    ? operators
    : new Map((operators ?? []).map((operator) => [operator.operatorKey, operator]));
}

function asBondLookup(bonds) {
  return bonds instanceof Map
    ? bonds
    : new Map((bonds ?? []).map((bond) => [bond.bondId, bond]));
}

function asStrategyLookup(strategies) {
  return strategies instanceof Map
    ? strategies
    : new Map((strategies ?? []).map((strategy) => [strategy.strategyId, strategy]));
}

function createFormationRecord(index, idFactory) {
  return {
    formationId: idFactory(),
    name: `编队 ${index}`,
    notes: '',
    strategyId: null,
    entries: [],
  };
}

function normalizeEntry(entry, operatorLookup, bondLookup, idFactory) {
  if (!entry || !operatorLookup.has(entry.operatorKey)) {
    return null;
  }

  const transferredBondId = bondLookup.has(entry.transferredBondId) ? entry.transferredBondId : null;

  return {
    entryId: typeof entry.entryId === 'string' && entry.entryId ? entry.entryId : idFactory(),
    operatorKey: entry.operatorKey,
    transferredBondId,
  };
}

function normalizeFormation(formation, index, operatorLookup, bondLookup, strategyLookup, idFactory) {
  const entries = (Array.isArray(formation?.entries) ? formation.entries : [])
    .map((entry) => normalizeEntry(entry, operatorLookup, bondLookup, idFactory))
    .filter(Boolean)
    .slice(0, MAX_FORMATION_SIZE);

  return {
    formationId: typeof formation?.formationId === 'string' && formation.formationId ? formation.formationId : idFactory(),
    name: typeof formation?.name === 'string' && formation.name.trim() ? formation.name.trim() : `编队 ${index + 1}`,
    notes: typeof formation?.notes === 'string' ? formation.notes : '',
    strategyId: strategyLookup.has(formation?.strategyId) ? formation.strategyId : null,
    entries,
  };
}

function updateFormationList(state, formationId, updater) {
  return {
    ...state,
    formations: state.formations.map((formation) => (
      formation.formationId === formationId ? updater(formation) : formation
    )),
  };
}

export function createFormationsState({ savedState = null, operators = [], bonds = [], strategies = [], idFactory = defaultIdFactory } = {}) {
  const operatorLookup = asOperatorLookup(operators);
  const bondLookup = asBondLookup(bonds);
  const strategyLookup = asStrategyLookup(strategies);
  const savedFormations = Array.isArray(savedState?.formations) ? savedState.formations : [];
  const formations = savedFormations
    .map((formation, index) => normalizeFormation(formation, index, operatorLookup, bondLookup, strategyLookup, idFactory))
    .filter(Boolean);

  if (formations.length === 0) {
    formations.push(createFormationRecord(1, idFactory));
  }

  const selectedFormationId = formations.some((formation) => formation.formationId === savedState?.selectedFormationId)
    ? savedState.selectedFormationId
    : formations[0]?.formationId ?? null;

  const selectedFormation = formations.find((formation) => formation.formationId === selectedFormationId) ?? null;
  const selectedEntryId = selectedFormation?.entries.some((entry) => entry.entryId === savedState?.selectedEntryId)
    ? savedState.selectedEntryId
    : selectedFormation?.entries[0]?.entryId ?? null;

  return {
    formations,
    selectedFormationId,
    selectedEntryId,
  };
}

export function serializeFormationsState(state) {
  return {
    formations: state.formations,
    selectedFormationId: state.selectedFormationId,
    selectedEntryId: state.selectedEntryId,
  };
}

export function addFormation(state, { idFactory = defaultIdFactory } = {}) {
  const nextFormation = createFormationRecord(state.formations.length + 1, idFactory);

  return {
    ...state,
    formations: [...state.formations, nextFormation],
    selectedFormationId: nextFormation.formationId,
    selectedEntryId: null,
  };
}

export function updateFormation(state, formationId, patch) {
  return updateFormationList(state, formationId, (formation) => ({
    ...formation,
    name: patch.name ?? formation.name,
    notes: patch.notes ?? formation.notes,
  }));
}

export function setFormationStrategy(state, { formationId, strategyId } = {}) {
  return updateFormationList(state, formationId, (formation) => ({
    ...formation,
    strategyId: strategyId || null,
  }));
}

export function selectFormation(state, formationId) {
  const formation = state.formations.find((item) => item.formationId === formationId);

  if (!formation) {
    return state;
  }

  return {
    ...state,
    selectedFormationId: formationId,
    selectedEntryId: formation.entries[0]?.entryId ?? null,
  };
}

export function deleteFormation(state, formationId) {
  const formations = state.formations.filter((formation) => formation.formationId !== formationId);
  const selectedFormation = formations[0] ?? null;

  return {
    ...state,
    formations,
    selectedFormationId: selectedFormation?.formationId ?? null,
    selectedEntryId: selectedFormation?.entries[0]?.entryId ?? null,
  };
}

export function addOperatorToFormation(state, { formationId, operatorKey, idFactory = defaultIdFactory } = {}) {
  let addedEntryId = null;

  const nextState = updateFormationList(state, formationId, (formation) => {
    if (formation.entries.length >= MAX_FORMATION_SIZE) {
      return formation;
    }

    addedEntryId = idFactory();

    return {
      ...formation,
      entries: [
        ...formation.entries,
        {
          entryId: addedEntryId,
          operatorKey,
          transferredBondId: null,
        },
      ],
    };
  });

  if (!addedEntryId) {
    return nextState;
  }

  return {
    ...nextState,
    selectedFormationId: formationId,
    selectedEntryId: addedEntryId,
  };
}

export function selectFormationEntry(state, { formationId, entryId } = {}) {
  const formation = state.formations.find((item) => item.formationId === formationId);

  if (!formation?.entries.some((entry) => entry.entryId === entryId)) {
    return state;
  }

  return {
    ...state,
    selectedFormationId: formationId,
    selectedEntryId: entryId,
  };
}

export function removeFormationEntry(state, { formationId, entryId } = {}) {
  const nextState = updateFormationList(state, formationId, (formation) => ({
    ...formation,
    entries: formation.entries.filter((entry) => entry.entryId !== entryId),
  }));

  const activeFormation = nextState.formations.find((formation) => formation.formationId === formationId);

  if (!activeFormation) {
    return nextState;
  }

  return {
    ...nextState,
    selectedEntryId: activeFormation.entries.some((entry) => entry.entryId === nextState.selectedEntryId)
      ? nextState.selectedEntryId
      : activeFormation.entries[0]?.entryId ?? null,
  };
}

export function setFormationEntryTransferBond(state, { formationId, entryId, transferredBondId } = {}) {
  return updateFormationList(state, formationId, (formation) => ({
    ...formation,
    entries: formation.entries.map((entry) => (
      entry.entryId === entryId
        ? { ...entry, transferredBondId: transferredBondId || null }
        : entry
    )),
  }));
}

export function getSelectedFormation(state) {
  return state.formations.find((formation) => formation.formationId === state.selectedFormationId) ?? null;
}

export function getSelectedFormationEntry(state) {
  const formation = getSelectedFormation(state);
  return formation?.entries.find((entry) => entry.entryId === state.selectedEntryId) ?? null;
}

export function buildFormationBondSummary({ formation, operators, bonds }) {
  const operatorLookup = asOperatorLookup(operators);
  const orderedBonds = (bonds instanceof Map ? [...bonds.values()] : [...(bonds ?? [])])
    .sort((left, right) => (
      left.identifier - right.identifier ||
      left.name.localeCompare(right.name, 'zh-Hans-CN') ||
      left.bondId.localeCompare(right.bondId)
    ));
  const bondCounts = new Map();
  const contributorsByBond = new Map();

  for (const entry of formation?.entries ?? []) {
    const operator = operatorLookup.get(entry.operatorKey);
    if (!operator) {
      continue;
    }

    const effectiveBondIds = new Set([
      ...operator.bonds.map((bond) => bond.bondId),
      entry.transferredBondId,
    ].filter(Boolean));

    for (const bondId of effectiveBondIds) {
      if (!bondCounts.has(bondId)) {
        bondCounts.set(bondId, new Set());
        contributorsByBond.set(bondId, new Map());
      }

      bondCounts.get(bondId).add(operator.charId);
      contributorsByBond.get(bondId).set(operator.charId, operator.name);
    }
  }

  const shownBonds = orderedBonds
    .map((bond) => {
      const contributorIds = bondCounts.get(bond.bondId);
      const currentCount = contributorIds?.size ?? 0;

      if (currentCount === 0) {
        return null;
      }

      return {
        ...bond,
        currentCount,
        contributorNames: [...contributorsByBond.get(bond.bondId).values()].sort((left, right) => left.localeCompare(right, 'zh-Hans-CN')),
        isSatisfied: currentCount >= bond.activationThreshold,
      };
    })
    .filter(Boolean);

  return {
    requiresPersonnelDocument: (formation?.entries?.length ?? 0) === MAX_FORMATION_SIZE,
    satisfiedBonds: shownBonds.filter((bond) => bond.isSatisfied),
    unsatisfiedBonds: shownBonds.filter((bond) => !bond.isSatisfied),
  };
}
