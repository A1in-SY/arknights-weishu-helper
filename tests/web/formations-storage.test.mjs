import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FORMATIONS_STORAGE_KEY,
} from '../../web/formations-state.mjs';
import {
  hydrateStoredFormations,
  loadStoredFormations,
  saveStoredFormations,
  serializeStoredFormations,
} from '../../web/formations-storage.mjs';

const operators = [
  {
    operatorKey: 'fixed:char_exusiai',
    charId: 'char_exusiai',
    name: '能天使',
    bonds: [
      { bondId: 'lateranoShip', name: '拉特兰' },
    ],
  },
];

const bonds = [
  { bondId: 'lateranoShip', name: '拉特兰', identifier: 5, category: { key: 'core', label: '核心盟约' }, desc: 'desc', activationThreshold: 2 },
];

const strategies = [
  { strategyId: 'band_duyaoy', name: '杜遥夜' },
];

const sampleLegacyStoredFormations = {
  formations: [
    {
      formationId: 'formation-1',
      name: '测试队',
      notes: '备注',
      strategyId: 'band_duyaoy',
      entries: [
        {
          entryId: 'entry-2',
          operatorKey: 'fixed:char_exusiai',
          transferredBondId: null,
        },
      ],
    },
  ],
  selectedFormationId: 'formation-1',
  selectedEntryId: 'entry-2',
};

function createMemoryStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };
}

test('hydrateStoredFormations separates runtime formation data from initial selection snapshot', () => {
  const hydrated = hydrateStoredFormations({
    savedState: sampleLegacyStoredFormations,
    operators,
    bonds,
    strategies,
  });

  assert.deepEqual(hydrated.formationsState.formations, sampleLegacyStoredFormations.formations);
  assert.deepEqual(hydrated.viewStatePatch, {
    formationsView: {
      desktopFrame: {
        selectedFormationId: 'formation-1',
        selectedEntryId: 'entry-2',
      },
    },
  });
});

test('hydrateStoredFormations clears invalid selected entry after formation normalization', () => {
  const hydrated = hydrateStoredFormations({
    savedState: {
      formations: [
        {
          ...sampleLegacyStoredFormations.formations[0],
          entries: [
            {
              entryId: 'entry-1',
              operatorKey: 'missing-operator',
              transferredBondId: null,
            },
          ],
        },
      ],
      selectedFormationId: 'formation-1',
      selectedEntryId: 'entry-1',
    },
    operators,
    bonds,
    strategies,
  });

  assert.deepEqual(hydrated.formationsState.formations[0].entries, []);
  assert.deepEqual(hydrated.viewStatePatch, {
    formationsView: {
      desktopFrame: {
        selectedFormationId: 'formation-1',
        selectedEntryId: null,
      },
    },
  });
});

test('serializeStoredFormations keeps legacy payload shape and does not leak runtime-only fields', () => {
  const payload = serializeStoredFormations({
    formationsState: {
      formations: sampleLegacyStoredFormations.formations,
      runtimeOnly: 'ignore-me',
    },
    selectedFormationId: 'formation-1',
    selectedEntryId: 'entry-2',
  });

  assert.deepEqual(payload, sampleLegacyStoredFormations);
});

test('loadStoredFormations and saveStoredFormations round-trip the legacy payload unchanged', () => {
  const storage = createMemoryStorage({
    [FORMATIONS_STORAGE_KEY]: JSON.stringify(sampleLegacyStoredFormations),
  });

  const loaded = loadStoredFormations(storage);
  saveStoredFormations(sampleLegacyStoredFormations, storage);

  assert.deepEqual(loaded, sampleLegacyStoredFormations);
  assert.equal(storage.getItem(FORMATIONS_STORAGE_KEY), JSON.stringify(sampleLegacyStoredFormations));
});
