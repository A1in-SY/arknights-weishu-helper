function normalizeAnchorRect(anchorRect) {
  if (!anchorRect) {
    return null;
  }

  return {
    top: Number(anchorRect.top) || 0,
    left: Number(anchorRect.left) || 0,
    width: Number(anchorRect.width) || 0,
    height: Number(anchorRect.height) || 0,
  };
}

export function createPopoverState() {
  return {
    isOpen: false,
    bondId: null,
    hostKey: null,
    anchorRect: null,
  };
}

export function closeBondPopover() {
  return createPopoverState();
}

export function toggleBondPopover(state, { bondId, hostKey, anchorRect } = {}) {
  if (!bondId || !hostKey) {
    return state ?? createPopoverState();
  }

  const currentState = state ?? createPopoverState();
  if (currentState.isOpen && currentState.hostKey === hostKey) {
    return closeBondPopover();
  }

  return {
    isOpen: true,
    bondId,
    hostKey,
    anchorRect: normalizeAnchorRect(anchorRect),
  };
}
