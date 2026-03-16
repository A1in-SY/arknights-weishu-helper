function createOperatorListFrame() {
  return { screen: 'operatorList', scrollTop: 0 };
}

function createFormationListFrame() {
  return { screen: 'formationList', scrollTop: 0 };
}

function mergeObjects(base, patch) {
  return {
    ...base,
    ...(patch ?? {}),
  };
}

function normalizeScrollTop(value) {
  return Number.isFinite(value) ? value : 0;
}

function sameFrameIdentity(left, right) {
  if (!left || !right || left.screen !== right.screen) {
    return false;
  }

  if (left.screen === 'operatorDetail') {
    return left.operatorKey === right.operatorKey;
  }

  if (left.screen === 'formationDetail') {
    return left.formationId === right.formationId;
  }

  if (left.screen === 'formationOperatorDetail') {
    return left.formationId === right.formationId && left.entryId === right.entryId;
  }

  return true;
}

function normalizeMode(value) {
  return value === 'formations' ? 'formations' : 'operators';
}

function normalizeOperatorDesktopFrame(frame, visibleOperatorKeys) {
  return {
    selectedOperatorKey: visibleOperatorKeys.includes(frame?.selectedOperatorKey)
      ? frame.selectedOperatorKey
      : visibleOperatorKeys[0] ?? null,
    resultsScrollTop: normalizeScrollTop(frame?.resultsScrollTop),
  };
}

function sanitizeOperatorDesktopFrame(frame) {
  return {
    selectedOperatorKey: typeof frame?.selectedOperatorKey === 'string' ? frame.selectedOperatorKey : null,
    resultsScrollTop: normalizeScrollTop(frame?.resultsScrollTop),
  };
}

function normalizeOperatorMobileFrame(frame, visibleOperatorKeys) {
  if (frame?.screen !== 'operatorDetail') {
    return createOperatorListFrame();
  }

  if (visibleOperatorKeys.includes(frame.operatorKey)) {
    return {
      screen: 'operatorDetail',
      operatorKey: frame.operatorKey,
      scrollTop: normalizeScrollTop(frame.scrollTop),
    };
  }

  if (visibleOperatorKeys[0]) {
    return {
      screen: 'operatorDetail',
      operatorKey: visibleOperatorKeys[0],
      scrollTop: normalizeScrollTop(frame.scrollTop),
    };
  }

  return createOperatorListFrame();
}

function cleanOperatorMobileStack(stack, visibleOperatorKeys) {
  const source = Array.isArray(stack) && stack.length > 0 ? stack : [createOperatorListFrame()];
  const result = [createOperatorListFrame()];

  for (const frame of source.slice(1)) {
    const normalizedFrame = normalizeOperatorMobileFrame(frame, visibleOperatorKeys);
    if (normalizedFrame.screen === 'operatorList') {
      continue;
    }
    if (sameFrameIdentity(result.at(-1), normalizedFrame)) {
      result[result.length - 1] = normalizedFrame;
      continue;
    }
    result.push(normalizedFrame);
  }

  return result;
}

function sanitizeOperatorMobileStack(stack) {
  const source = Array.isArray(stack) && stack.length > 0 ? stack : [createOperatorListFrame()];
  const result = [createOperatorListFrame()];

  for (const frame of source.slice(1)) {
    if (result.length >= 2) {
      break;
    }
    if (frame?.screen !== 'operatorDetail' || !frame.operatorKey) {
      continue;
    }

    const normalizedFrame = {
      screen: 'operatorDetail',
      operatorKey: frame.operatorKey,
      scrollTop: normalizeScrollTop(frame.scrollTop),
    };

    if (sameFrameIdentity(result.at(-1), normalizedFrame)) {
      result[result.length - 1] = normalizedFrame;
      continue;
    }

    result.push(normalizedFrame);
  }

  return result;
}

function buildFormationLookup(formations) {
  return new Map((formations ?? []).map((formation) => [formation.formationId, formation]));
}

function normalizeFormationDesktopFrame(frame, formations) {
  const selectedFormationId = formations.some((formation) => formation.formationId === frame?.selectedFormationId)
    ? frame.selectedFormationId
    : formations[0]?.formationId ?? null;
  const selectedFormation = formations.find((formation) => formation.formationId === selectedFormationId) ?? null;
  const selectedEntryId = selectedFormation?.entries.some((entry) => entry.entryId === frame?.selectedEntryId)
    ? frame.selectedEntryId
    : null;

  return {
    selectedFormationId,
    selectedEntryId,
    listScrollTop: normalizeScrollTop(frame?.listScrollTop),
    detailScrollTop: normalizeScrollTop(frame?.detailScrollTop),
  };
}

function sanitizeFormationDesktopFrame(frame) {
  return {
    selectedFormationId: typeof frame?.selectedFormationId === 'string' ? frame.selectedFormationId : null,
    selectedEntryId: typeof frame?.selectedEntryId === 'string' ? frame.selectedEntryId : null,
    listScrollTop: normalizeScrollTop(frame?.listScrollTop),
    detailScrollTop: normalizeScrollTop(frame?.detailScrollTop),
  };
}

function normalizeFormationMobileFrame(frame, formationLookup) {
  const formation = formationLookup.get(frame?.formationId);

  if (frame?.screen === 'formationDetail') {
    if (!formation) {
      return createFormationListFrame();
    }
    return {
      screen: 'formationDetail',
      formationId: formation.formationId,
      scrollTop: normalizeScrollTop(frame.scrollTop),
      overlay: frame.overlay === 'strategyPicker' ? 'strategyPicker' : null,
    };
  }

  if (frame?.screen === 'formationOperatorDetail') {
    if (!formation) {
      return createFormationListFrame();
    }
    if (!formation.entries.some((entry) => entry.entryId === frame.entryId)) {
      return {
        screen: 'formationDetail',
        formationId: formation.formationId,
        scrollTop: 0,
        overlay: null,
      };
    }
    return {
      screen: 'formationOperatorDetail',
      formationId: formation.formationId,
      entryId: frame.entryId,
      scrollTop: normalizeScrollTop(frame.scrollTop),
    };
  }

  return createFormationListFrame();
}

function cleanFormationMobileStack(stack, formations) {
  const formationLookup = buildFormationLookup(formations);
  const source = Array.isArray(stack) && stack.length > 0 ? stack : [createFormationListFrame()];
  const result = [createFormationListFrame()];

  for (const frame of source.slice(1)) {
    const normalizedFrame = normalizeFormationMobileFrame(frame, formationLookup);
    const topFrame = result.at(-1);

    if (normalizedFrame.screen === 'formationList') {
      continue;
    }

    if (normalizedFrame.screen === 'formationDetail' && topFrame.screen !== 'formationList') {
      continue;
    }

    if (normalizedFrame.screen === 'formationOperatorDetail') {
      if (topFrame.screen !== 'formationDetail' || topFrame.formationId !== normalizedFrame.formationId) {
        continue;
      }
    }

    if (sameFrameIdentity(topFrame, normalizedFrame)) {
      result[result.length - 1] = normalizedFrame;
      continue;
    }
    result.push(normalizedFrame);
  }

  return result;
}

function sanitizeFormationMobileStack(stack) {
  const source = Array.isArray(stack) && stack.length > 0 ? stack : [createFormationListFrame()];
  const result = [createFormationListFrame()];

  for (const frame of source.slice(1)) {
    const topFrame = result.at(-1);
    let normalizedFrame = null;

    if (frame?.screen === 'formationDetail' && frame.formationId) {
      normalizedFrame = {
        screen: 'formationDetail',
        formationId: frame.formationId,
        scrollTop: normalizeScrollTop(frame.scrollTop),
        overlay: frame.overlay === 'strategyPicker' ? 'strategyPicker' : null,
      };
    }

    if (frame?.screen === 'formationOperatorDetail' && frame.formationId && frame.entryId) {
      normalizedFrame = {
        screen: 'formationOperatorDetail',
        formationId: frame.formationId,
        entryId: frame.entryId,
        scrollTop: normalizeScrollTop(frame.scrollTop),
      };
    }

    if (!normalizedFrame) {
      continue;
    }

    if (normalizedFrame.screen === 'formationDetail' && topFrame.screen !== 'formationList') {
      continue;
    }

    if (normalizedFrame.screen === 'formationOperatorDetail') {
      if (topFrame.screen !== 'formationDetail' || topFrame.formationId !== normalizedFrame.formationId) {
        continue;
      }
    }

    if (sameFrameIdentity(topFrame, normalizedFrame)) {
      result[result.length - 1] = normalizedFrame;
      continue;
    }

    result.push(normalizedFrame);
  }

  return enforceFormationOverlayInvariant(result);
}

function clearTopFormationOverlay(stack) {
  if (!Array.isArray(stack) || stack.length === 0) {
    return [createFormationListFrame()];
  }

  const topFrame = stack.at(-1);
  if (topFrame?.screen !== 'formationDetail' || topFrame.overlay === null) {
    return stack;
  }

  return [
    ...stack.slice(0, -1),
    {
      ...topFrame,
      overlay: null,
    },
  ];
}

function enforceFormationOverlayInvariant(stack) {
  return stack.map((frame, index) => {
    if (frame.screen !== 'formationDetail') {
      return frame;
    }

    return {
      ...frame,
      overlay: index === stack.length - 1 && frame.overlay === 'strategyPicker' ? 'strategyPicker' : null,
    };
  });
}

export function createViewState(patch = {}) {
  const defaultState = {
    mode: 'operators',
    operatorsView: {
      desktopFrame: {
        selectedOperatorKey: null,
        resultsScrollTop: 0,
      },
      mobileStack: [createOperatorListFrame()],
    },
    formationsView: {
      desktopFrame: {
        selectedFormationId: null,
        selectedEntryId: null,
        listScrollTop: 0,
        detailScrollTop: 0,
      },
      mobileStack: [createFormationListFrame()],
    },
  };

  return {
    mode: normalizeMode(patch.mode ?? defaultState.mode),
    operatorsView: {
      desktopFrame: sanitizeOperatorDesktopFrame(mergeObjects(defaultState.operatorsView.desktopFrame, patch.operatorsView?.desktopFrame)),
      mobileStack: sanitizeOperatorMobileStack(patch.operatorsView?.mobileStack ?? defaultState.operatorsView.mobileStack),
    },
    formationsView: {
      desktopFrame: sanitizeFormationDesktopFrame(mergeObjects(defaultState.formationsView.desktopFrame, patch.formationsView?.desktopFrame)),
      mobileStack: sanitizeFormationMobileStack(patch.formationsView?.mobileStack ?? defaultState.formationsView.mobileStack),
    },
  };
}

export function pushOperatorDetail(viewState, { operatorKey }) {
  const baseState = createViewState(viewState);
  if (!operatorKey || baseState.operatorsView.mobileStack.at(-1)?.screen !== 'operatorList') {
    return viewState;
  }

  return {
    ...baseState,
    operatorsView: {
      ...baseState.operatorsView,
      mobileStack: [
        ...baseState.operatorsView.mobileStack,
        {
          screen: 'operatorDetail',
          operatorKey,
          scrollTop: 0,
        },
      ],
    },
  };
}

export function pushFormationDetail(viewState, { formationId }) {
  const baseState = createViewState(viewState);
  if (!formationId || baseState.formationsView.mobileStack.at(-1)?.screen !== 'formationList') {
    return viewState;
  }

  return {
    ...baseState,
    formationsView: {
      ...baseState.formationsView,
      mobileStack: [
        ...baseState.formationsView.mobileStack,
        {
          screen: 'formationDetail',
          formationId,
          scrollTop: 0,
          overlay: null,
        },
      ],
    },
  };
}

export function pushFormationOperatorDetail(viewState, { formationId, entryId }) {
  const baseState = createViewState(viewState);
  const topFrame = baseState.formationsView.mobileStack.at(-1);
  if (!formationId || !entryId || topFrame?.screen !== 'formationDetail' || topFrame.formationId !== formationId) {
    return viewState;
  }

  return {
    ...baseState,
    formationsView: {
      ...baseState.formationsView,
      mobileStack: [
        ...baseState.formationsView.mobileStack.slice(0, -1),
        {
          ...topFrame,
          overlay: null,
        },
        {
          screen: 'formationOperatorDetail',
          formationId,
          entryId,
          scrollTop: 0,
        },
      ],
    },
  };
}

export function openFormationStrategyOverlay(viewState) {
  const baseState = createViewState(viewState);
  const stack = baseState.formationsView.mobileStack;
  const topFrame = stack.at(-1);

  if (topFrame?.screen !== 'formationDetail') {
    return viewState;
  }

  return {
    ...baseState,
    formationsView: {
      ...baseState.formationsView,
      mobileStack: [
        ...stack.slice(0, -1),
        {
          ...topFrame,
          overlay: 'strategyPicker',
        },
      ],
    },
  };
}

export function normalizeViewState(viewState, { visibleOperatorKeys = [], formations = [] } = {}) {
  return {
    ...viewState,
    mode: normalizeMode(viewState.mode),
    operatorsView: {
      desktopFrame: normalizeOperatorDesktopFrame(viewState.operatorsView?.desktopFrame, visibleOperatorKeys),
      mobileStack: cleanOperatorMobileStack(viewState.operatorsView?.mobileStack, visibleOperatorKeys),
    },
    formationsView: {
      desktopFrame: normalizeFormationDesktopFrame(viewState.formationsView?.desktopFrame, formations),
      mobileStack: enforceFormationOverlayInvariant(cleanFormationMobileStack(viewState.formationsView?.mobileStack, formations)),
    },
  };
}

export function restoreViewportWorkspace(viewState, viewport) {
  if (viewport !== 'desktop' && viewport !== 'mobile') {
    return viewState;
  }

  const baseState = createViewState(viewState);
  return {
    ...baseState,
    formationsView: {
      ...baseState.formationsView,
      mobileStack: clearTopFormationOverlay(baseState.formationsView?.mobileStack),
    },
  };
}
