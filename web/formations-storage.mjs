import { FORMATIONS_STORAGE_KEY, createFormationsState } from './formations-state.mjs';

export function hydrateStoredFormations({ savedState = null, operators = [], bonds = [], strategies = [], idFactory } = {}) {
  const formationsState = createFormationsState({
    formations: savedState?.formations ?? [],
    operators,
    bonds,
    strategies,
    idFactory,
  });
  const selectedFormationId = formationsState.formations.some((formation) => formation.formationId === savedState?.selectedFormationId)
    ? savedState.selectedFormationId
    : formationsState.formations[0]?.formationId ?? null;
  const selectedFormation = formationsState.formations.find((formation) => formation.formationId === selectedFormationId) ?? null;
  const selectedEntryId = selectedFormation?.entries.some((entry) => entry.entryId === savedState?.selectedEntryId)
    ? savedState.selectedEntryId
    : null;

  return {
    formationsState,
    viewStatePatch: {
      formationsView: {
        desktopFrame: {
          selectedFormationId,
          selectedEntryId,
        },
      },
    },
  };
}

export function serializeStoredFormations({ formationsState, selectedFormationId, selectedEntryId }) {
  return {
    formations: formationsState.formations,
    selectedFormationId,
    selectedEntryId,
  };
}

export function loadStoredFormations(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem?.(FORMATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredFormations(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem?.(FORMATIONS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures. The page should stay usable without persistence.
  }
}
