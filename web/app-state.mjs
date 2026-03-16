const ALL_LABEL = '全部';

function compareOperators(left, right) {
  return (
    right.shop.tier.value - left.shop.tier.value ||
    right.rarity.value - left.rarity.value ||
    left.name.localeCompare(right.name, 'zh-Hans-CN') ||
    (left.source?.kind === right.source?.kind ? 0 : left.source?.kind === 'fixed' ? -1 : 1) ||
    left.operatorKey.localeCompare(right.operatorKey)
  );
}

function normalizeSearchText(value) {
  return String(value ?? '').trim();
}

function matchesSearch(operator, searchText) {
  if (!searchText) {
    return true;
  }

  const normalizedAppellation = operator.appellation.toLowerCase();
  const normalizedSearch = searchText.toLowerCase();

  return operator.name.includes(searchText) || normalizedAppellation.includes(normalizedSearch);
}

function matchesFilters(operator, query) {
  const hasTierFilter = query.tierValue !== null && query.tierValue !== undefined;
  const hasGarrisonTriggerTimingFilter = Boolean(query.garrisonTriggerTiming);

  return (
    (!query.professionCode || operator.profession.code === query.professionCode) &&
    (!query.subProfessionCode || operator.subProfession.code === query.subProfessionCode) &&
    (!hasTierFilter || operator.shop.tier.value === query.tierValue) &&
    ((query.bondIds ?? []).length === 0 || query.bondIds.every((bondId) => operator.bonds.some((bond) => bond.bondId === bondId))) &&
    (
      !hasGarrisonTriggerTimingFilter ||
      operator.phases.some((phase) =>
        phase.garrisons.some((garrison) => (garrison.triggerTimings ?? []).includes(query.garrisonTriggerTiming)))
    )
  );
}

function distinctSorted(items, getValue, getLabel, type = 'label') {
  const seen = new Map();

  for (const item of items) {
    const value = getValue(item);
    if (!seen.has(value)) {
      seen.set(value, { value, label: getLabel(item) });
    }
  }

  const values = [...seen.values()].sort((left, right) => {
    if (type === 'number') {
      return left.value - right.value;
    }
    return left.label.localeCompare(right.label, 'zh-Hans-CN');
  });

  return [{ value: null, label: ALL_LABEL, isAllOption: true }, ...values];
}

function distinctBondGroups(items) {
  const groups = new Map();

  for (const item of items) {
    for (const bond of item.bonds) {
      const groupKey = bond.category?.key ?? 'extra';
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          key: groupKey,
          label: bond.category?.label ?? '附加盟约',
          items: new Map(),
        });
      }

      const group = groups.get(groupKey);
      if (!group.items.has(bond.bondId)) {
        group.items.set(bond.bondId, {
          value: bond.bondId,
          name: bond.name,
          label: bond.name,
          iconId: bond.iconId,
        });
      }
    }
  }

  return ['core', 'extra']
    .filter((key) => groups.has(key))
    .map((key) => {
      const group = groups.get(key);
      return {
        key: group.key,
        label: group.label,
        items: [...group.items.values()].sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN')),
      };
    });
}

function buildFilterOptions(operators) {
  return {
    professions: distinctSorted(operators, (item) => item.profession.code, (item) => item.profession.label),
    subProfessions: distinctSorted(operators, (item) => item.subProfession.code, (item) => item.subProfession.label),
    tiers: distinctSorted(operators, (item) => item.shop.tier.value, (item) => item.shop.tier.label, 'number'),
    garrisonTriggerTimings: distinctSorted(
      operators.flatMap((item) => item.phases.flatMap((phase) => phase.garrisons.flatMap((garrison) => garrison.triggerTimings ?? []))),
      (item) => item,
      (item) => item,
    ),
    bondGroups: distinctBondGroups(operators),
  };
}

function createEmptyQuery() {
  return {
    searchText: '',
    professionCode: null,
    subProfessionCode: null,
    tierValue: null,
    garrisonTriggerTiming: null,
    bondIds: [],
  };
}

export function createQueryState(operators) {
  const sortedOperators = [...operators].sort(compareOperators);

  return {
    operators: sortedOperators,
    query: createEmptyQuery(),
    filterOptions: buildFilterOptions(sortedOperators),
  };
}

export function applyQuery(state, nextQuery) {
  const query = {
    ...state.query,
    ...nextQuery,
    searchText: normalizeSearchText(nextQuery.searchText ?? state.query.searchText),
    bondIds: Array.isArray(nextQuery.bondIds)
      ? [...nextQuery.bondIds]
      : [...state.query.bondIds],
  };

  return {
    ...state,
    query,
  };
}

export function getVisibleOperators(state) {
  return state.operators
    .filter((operator) => matchesSearch(operator, state.query.searchText))
    .filter((operator) => matchesFilters(operator, state.query))
    .sort(compareOperators);
}
