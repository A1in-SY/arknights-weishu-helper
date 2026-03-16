export function renderViewModel(state) {
  if (state.status === 'error') {
    return {
      showCandidateList: false,
      candidateItems: [],
      detailSummary: null,
      bondRows: [],
      phaseSections: [],
    };
  }

  return {
    showCandidateList: true,
    candidateItems: (state.visibleOperators ?? []).map((operator) => ({
      operatorKey: operator.operatorKey,
      name: operator.name,
      professionLabel: operator.profession.label,
      subProfessionLabel: operator.subProfession.label,
      tierLabel: operator.shop.tier.label,
      sourceLabel: operator.source?.label ?? '',
      avatarUrl: operator.assets?.avatarPath ?? null,
      avatarFallbackUrls: [],
      isSelected: operator.operatorKey === state.selectedOperator?.operatorKey,
    })),
    detailSummary: state.selectedOperator ? {
      name: state.selectedOperator.name,
      sourceKind: state.selectedOperator.source?.kind ?? null,
      sourceLabel: state.selectedOperator.source?.label ?? '',
      professionLabel: state.selectedOperator.profession.label,
      subProfessionLabel: state.selectedOperator.subProfession.label,
      rarityLabel: state.selectedOperator.rarity.label,
      tierLabel: state.selectedOperator.shop.tier.label,
      purchasePrice: state.selectedOperator.shop.purchasePrice,
      sellPrice: state.selectedOperator.shop.sellPrice,
      avatarId: state.selectedOperator.assets?.avatarId ?? null,
      portraitId: state.selectedOperator.assets?.portraitId ?? null,
      avatarUrl: state.selectedOperator.assets?.avatarPath ?? null,
      avatarFallbackUrls: [],
    } : null,
    bondRows: state.selectedOperator?.bonds ?? [],
    phaseSections: (state.selectedOperator?.phases ?? []).map((phase) => ({
      key: phase.key,
      label: phase.label,
      garrisonRows: phase.garrisons,
    })),
  };
}
