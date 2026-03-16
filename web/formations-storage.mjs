import { FORMATIONS_STORAGE_KEY } from './formations-state.mjs';

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
