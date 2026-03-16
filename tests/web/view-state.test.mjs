import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createViewState,
  normalizeViewState,
  openFormationStrategyOverlay,
  pushFormationDetail,
  pushFormationOperatorDetail,
  pushOperatorDetail,
  restoreViewportWorkspace,
} from '../../web/view-state.mjs';

const sampleFormationWithEntries = {
  formationId: 'formation-1',
  name: '编队 1',
  notes: '',
  strategyId: null,
  entries: [
    { entryId: 'entry-1', operatorKey: 'fixed:char_exusiai', transferredBondId: null },
    { entryId: 'entry-2', operatorKey: 'fixed:char_texas', transferredBondId: null },
  ],
};

const sampleFormationTwoOnly = {
  formationId: 'formation-2',
  name: '编队 2',
  notes: '',
  strategyId: null,
  entries: [
    { entryId: 'entry-3', operatorKey: 'fixed:char_siege', transferredBondId: null },
  ],
};

test('mobile roots are non-removable list frames', () => {
  const state = createViewState();

  assert.deepEqual(state.operatorsView.mobileStack, [{ screen: 'operatorList', scrollTop: 0 }]);
  assert.deepEqual(state.formationsView.mobileStack, [{ screen: 'formationList', scrollTop: 0 }]);
});

test('createViewState keeps only declared top-level keys', () => {
  const state = createViewState();

  assert.deepEqual(Object.keys(state).sort(), ['formationsView', 'mode', 'operatorsView']);
});

test('createViewState sanitizes illegal mode and broken mobile roots', () => {
  const state = createViewState({
    mode: 'banana',
    operatorsView: {
      desktopFrame: { selectedOperatorKey: 'x', resultsScrollTop: Number.NaN, junk: true },
      mobileStack: [],
    },
    formationsView: {
      desktopFrame: { selectedFormationId: 'f', selectedEntryId: 'e', listScrollTop: Infinity, detailScrollTop: 'oops', junk: true },
      mobileStack: [
        { screen: 'formationOperatorDetail', formationId: 'formation-1', entryId: 'entry-2', scrollTop: 0, overlay: 'strategyPicker' },
      ],
    },
  });

  assert.equal(state.mode, 'operators');
  assert.deepEqual(state.operatorsView.desktopFrame, { selectedOperatorKey: 'x', resultsScrollTop: 0 });
  assert.deepEqual(state.formationsView.desktopFrame, {
    selectedFormationId: 'f',
    selectedEntryId: 'e',
    listScrollTop: 0,
    detailScrollTop: 0,
  });
  assert.deepEqual(state.operatorsView.mobileStack, [{ screen: 'operatorList', scrollTop: 0 }]);
  assert.deepEqual(state.formationsView.mobileStack, [{ screen: 'formationList', scrollTop: 0 }]);
});

test('overlay can only open on the active formationDetail frame', () => {
  const state = createViewState();

  assert.deepEqual(openFormationStrategyOverlay(state), state);
});

test('normalizeViewState repairs invalid desktop selections', () => {
  const state = createViewState({
    operatorsView: {
      desktopFrame: { selectedOperatorKey: 'missing-op', resultsScrollTop: 48 },
    },
    formationsView: {
      desktopFrame: {
        selectedFormationId: 'formation-1',
        selectedEntryId: 'missing-entry',
        listScrollTop: 0,
        detailScrollTop: 0,
      },
    },
  });

  const normalized = normalizeViewState(state, {
    visibleOperatorKeys: ['fixed:char_exusiai', 'fixed:char_texas'],
    formations: [sampleFormationWithEntries],
  });

  assert.equal(normalized.operatorsView.desktopFrame.selectedOperatorKey, 'fixed:char_exusiai');
  assert.equal(normalized.formationsView.desktopFrame.selectedEntryId, null);
});

test('normalizeViewState downgrades invalid mobile operator detail to the first visible operator detail', () => {
  const state = pushOperatorDetail(createViewState(), { operatorKey: 'missing-op' });

  const normalized = normalizeViewState(state, {
    visibleOperatorKeys: ['fixed:char_exusiai'],
    formations: [sampleFormationWithEntries],
  });

  assert.deepEqual(normalized.operatorsView.mobileStack, [
    { screen: 'operatorList', scrollTop: 0 },
    { screen: 'operatorDetail', operatorKey: 'fixed:char_exusiai', scrollTop: 0 },
  ]);
});

test('normalizeViewState downgrades invalid mobile operator detail to operatorList when no visible operators remain', () => {
  const state = pushOperatorDetail(createViewState(), { operatorKey: 'missing-op' });

  const normalized = normalizeViewState(state, {
    visibleOperatorKeys: [],
    formations: [sampleFormationWithEntries],
  });

  assert.deepEqual(normalized.operatorsView.mobileStack, [
    { screen: 'operatorList', scrollTop: 0 },
  ]);
});

test('normalizeViewState downgrades invalid formation detail to formationList', () => {
  const state = pushFormationDetail(createViewState(), { formationId: 'missing-formation' });

  const normalized = normalizeViewState(state, {
    visibleOperatorKeys: ['fixed:char_exusiai'],
    formations: [sampleFormationWithEntries],
  });

  assert.deepEqual(normalized.formationsView.mobileStack, [
    { screen: 'formationList', scrollTop: 0 },
  ]);
});

test('normalizeViewState downgrades invalid formation operator entry to the same formation detail', () => {
  let state = createViewState();
  state = pushFormationDetail(state, { formationId: 'formation-1' });
  state = pushFormationOperatorDetail(state, { formationId: 'formation-1', entryId: 'missing-entry' });

  const normalized = normalizeViewState(state, {
    visibleOperatorKeys: ['fixed:char_exusiai'],
    formations: [sampleFormationWithEntries],
  });

  assert.deepEqual(normalized.formationsView.mobileStack, [
    { screen: 'formationList', scrollTop: 0 },
    { screen: 'formationDetail', formationId: 'formation-1', scrollTop: 0, overlay: null },
  ]);
});

test('normalizeViewState downgrades invalid formation operator formation to formationList', () => {
  const state = pushFormationOperatorDetail(createViewState(), {
    formationId: 'missing-formation',
    entryId: 'entry-2',
  });

  const normalized = normalizeViewState(state, {
    visibleOperatorKeys: ['fixed:char_exusiai'],
    formations: [sampleFormationWithEntries],
  });

  assert.deepEqual(normalized.formationsView.mobileStack, [
    { screen: 'formationList', scrollTop: 0 },
  ]);
});

test('normalizeViewState repairs illegal stack sequences instead of keeping them', () => {
  const state = createViewState({
    operatorsView: {
      mobileStack: [
        { screen: 'operatorList', scrollTop: 0 },
        { screen: 'operatorDetail', operatorKey: 'fixed:char_exusiai', scrollTop: 0 },
        { screen: 'operatorDetail', operatorKey: 'fixed:char_texas', scrollTop: 0 },
      ],
    },
    formationsView: {
      mobileStack: [
        { screen: 'formationList', scrollTop: 0 },
        { screen: 'formationOperatorDetail', formationId: 'formation-1', entryId: 'entry-2', scrollTop: 0 },
      ],
    },
  });

  const normalized = normalizeViewState(state, {
    visibleOperatorKeys: ['fixed:char_exusiai', 'fixed:char_texas'],
    formations: [sampleFormationWithEntries],
  });

  assert.deepEqual(normalized.operatorsView.mobileStack, [
    { screen: 'operatorList', scrollTop: 0 },
    { screen: 'operatorDetail', operatorKey: 'fixed:char_exusiai', scrollTop: 0 },
  ]);
  assert.deepEqual(normalized.formationsView.mobileStack, [
    { screen: 'formationList', scrollTop: 0 },
  ]);
});

test('pushFormationOperatorDetail refuses to create a cross-formation path', () => {
  const state = pushFormationDetail(createViewState(), { formationId: 'formation-1' });
  const next = pushFormationOperatorDetail(state, {
    formationId: 'formation-2',
    entryId: 'entry-3',
  });

  assert.deepEqual(next, state);
});

test('normalizeViewState cleans the entire formation mobile stack after deleting a formation from a deep stack', () => {
  const state = createViewState({
    formationsView: {
      mobileStack: [
        { screen: 'formationList', scrollTop: 0 },
        { screen: 'formationDetail', formationId: 'formation-1', scrollTop: 0, overlay: 'strategyPicker' },
        { screen: 'formationOperatorDetail', formationId: 'formation-1', entryId: 'entry-2', scrollTop: 0 },
        { screen: 'formationDetail', formationId: 'formation-2', scrollTop: 0, overlay: null },
      ],
    },
  });

  const normalized = normalizeViewState(state, {
    visibleOperatorKeys: ['fixed:char_exusiai'],
    formations: [sampleFormationTwoOnly],
  });

  assert.deepEqual(normalized.formationsView.mobileStack, [
    { screen: 'formationList', scrollTop: 0 },
  ]);
});

test('normalizeViewState clears illegal overlay state during normalization', () => {
  const state = createViewState({
    formationsView: {
      mobileStack: [
        { screen: 'formationList', scrollTop: 0 },
        { screen: 'formationOperatorDetail', formationId: 'formation-1', entryId: 'entry-2', scrollTop: 0, overlay: 'strategyPicker' },
      ],
    },
  });

  const normalized = normalizeViewState(state, {
    visibleOperatorKeys: ['fixed:char_exusiai'],
    formations: [sampleFormationWithEntries],
  });

  assert.equal('overlay' in normalized.formationsView.mobileStack.at(-1), false);
});

test('normalizeViewState clears overlay from non-top formation detail frames', () => {
  const state = createViewState({
    formationsView: {
      mobileStack: [
        { screen: 'formationList', scrollTop: 0 },
        { screen: 'formationDetail', formationId: 'formation-1', scrollTop: 0, overlay: 'strategyPicker' },
        { screen: 'formationOperatorDetail', formationId: 'formation-1', entryId: 'entry-2', scrollTop: 0 },
      ],
    },
  });

  const normalized = normalizeViewState(state, {
    visibleOperatorKeys: ['fixed:char_exusiai'],
    formations: [sampleFormationWithEntries],
  });

  assert.equal(normalized.formationsView.mobileStack[1].overlay, null);
});

test('pushOperatorDetail refuses invalid transitions and missing operator keys', () => {
  const root = createViewState();
  const onList = pushOperatorDetail(root, { operatorKey: 'fixed:char_exusiai' });
  const duplicate = pushOperatorDetail(onList, { operatorKey: 'fixed:char_texas' });
  const missing = pushOperatorDetail(root, {});

  assert.equal(onList.operatorsView.mobileStack.at(-1).screen, 'operatorDetail');
  assert.deepEqual(duplicate, onList);
  assert.deepEqual(missing, root);
});

test('view-state transitions do not mutate previous state snapshots', () => {
  const state = createViewState();
  const next = pushOperatorDetail(state, { operatorKey: 'fixed:char_exusiai' });

  next.formationsView.desktopFrame.selectedFormationId = 'formation-1';

  assert.equal(state.formationsView.desktopFrame.selectedFormationId, null);
});

test('restoreViewportWorkspace preserves operator and formation snapshots independently across viewport changes', () => {
  let state = createViewState();
  state.operatorsView.desktopFrame.selectedOperatorKey = 'desktop-op';
  state.formationsView.desktopFrame.selectedFormationId = 'formation-1';
  state.formationsView.desktopFrame.detailScrollTop = 220;
  state = pushOperatorDetail(state, { operatorKey: 'mobile-op' });
  state = pushFormationDetail(state, { formationId: 'formation-2' });
  state.formationsView.mobileStack.at(-1).scrollTop = 135;
  state.formationsView.mobileStack.at(-1).overlay = 'strategyPicker';

  const desktop = restoreViewportWorkspace(state, 'desktop');
  const mobile = restoreViewportWorkspace(state, 'mobile');

  assert.equal(desktop.operatorsView.desktopFrame.selectedOperatorKey, 'desktop-op');
  assert.equal(desktop.formationsView.desktopFrame.detailScrollTop, 220);
  assert.equal(desktop.formationsView.mobileStack.at(-1).overlay, null);
  assert.equal(mobile.operatorsView.mobileStack.at(-1).operatorKey, 'mobile-op');
  assert.equal(mobile.formationsView.mobileStack.at(-1).scrollTop, 135);
  assert.equal(mobile.formationsView.mobileStack.at(-1).overlay, null);
});
