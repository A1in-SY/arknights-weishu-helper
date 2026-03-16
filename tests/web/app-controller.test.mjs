import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppController } from '../../web/app-controller.mjs';

function createSampleOperator({ operatorKey, name }) {
  return {
    operatorKey,
    charId: operatorKey,
    name,
    appellation: name.toLowerCase(),
    source: { kind: 'fixed', label: '固定编队', isInferred: false },
    profession: { code: 'SNIPER', label: '狙击' },
    subProfession: { code: 'fastshot', label: '速射手' },
    rarity: { value: 6, code: 'TIER_6', label: '六星' },
    assets: {
      avatarId: operatorKey,
      portraitId: `${operatorKey}_1`,
      avatarPath: `/data/operators/${operatorKey}.png`,
    },
    shop: {
      tier: { value: 5, label: 'V阶' },
      purchasePrice: 2,
      sellPrice: 1,
    },
    bonds: [
      {
        bondId: 'lateranoShip',
        name: '拉特兰',
        iconId: 'icon_lateranoShip',
        category: { key: 'core', label: '核心盟约' },
        desc: '拉特兰说明',
      },
    ],
    phases: [
      {
        key: 'base',
        label: '初始',
        chessId: `${operatorKey}_base`,
        garrisons: [
          {
            garrisonId: `${operatorKey}_garrison`,
            garrisonDesc: `${name} 特质`,
            triggerTimings: ['部署后'],
          },
        ],
      },
    ],
  };
}

function createSampleData() {
  return {
    operators: [
      createSampleOperator({ operatorKey: 'desktop-op', name: '桌面干员' }),
      createSampleOperator({ operatorKey: 'mobile-op', name: '移动干员' }),
    ],
    bonds: [
      {
        bondId: 'lateranoShip',
        name: '拉特兰',
        iconId: 'icon_lateranoShip',
        category: { key: 'core', label: '核心盟约' },
        desc: '拉特兰说明',
        activationThreshold: 2,
        identifier: 1,
      },
    ],
    strategies: [
      {
        strategyId: 'strategy-1',
        name: '测试策略',
        iconId: 'icon_strategy_1',
        iconPath: '/data/strategies/strategy-1.png',
        totalHp: 30,
        unlockDesc: null,
        effectId: 'effect_1',
        effectName: '测试效果',
        effectDesc: '策略说明',
      },
    ],
  };
}

function createStoredFormations() {
  return {
    formations: [
      {
        formationId: 'formation-1',
        name: '测试编队',
        notes: '记录',
        strategyId: 'strategy-1',
        entries: [
          { entryId: 'entry-1', operatorKey: 'desktop-op', transferredBondId: null },
          { entryId: 'entry-2', operatorKey: 'mobile-op', transferredBondId: null },
        ],
      },
    ],
    selectedFormationId: 'formation-1',
    selectedEntryId: null,
  };
}

function createClosestTarget(matches) {
  return {
    closest(selector) {
      return matches[selector] ?? null;
    },
  };
}

test('controller restores desktop and mobile workspaces when viewport changes and selects the active render path', () => {
  const controller = createAppController({ data: createSampleData(), viewportWidth: 1200 });

  controller.selectDesktopOperator('desktop-op');
  controller.setViewportWidth(375);
  controller.selectMobileOperator('mobile-op');
  controller.setViewportWidth(1200);

  assert.equal(controller.getState().viewState.operatorsView.desktopFrame.selectedOperatorKey, 'desktop-op');

  controller.setViewportWidth(375);

  assert.equal(controller.getState().viewState.operatorsView.mobileStack.at(-1).operatorKey, 'mobile-op');
  assert.match(controller.render(), /data-mobile-operator-detail-page/);
});

test('controller pushes operator detail and returns to operator list on mobile', () => {
  const controller = createAppController({ data: createSampleData(), viewportWidth: 375 });

  controller.selectMobileOperator('desktop-op');

  assert.equal(controller.getState().viewState.operatorsView.mobileStack.at(-1).screen, 'operatorDetail');
  assert.match(controller.render(), /data-mobile-operator-detail-page/);

  controller.handleBack();

  assert.equal(controller.getState().viewState.operatorsView.mobileStack.at(-1).screen, 'operatorList');
  assert.match(controller.render(), /data-mobile-operator-list-page/);
});

test('mobile mode switches preserve independent operator and formation workspaces', () => {
  const controller = createAppController({ data: createSampleData(), viewportWidth: 375 });

  controller.selectMobileOperator('desktop-op');
  controller.setMode('formations');
  controller.setMode('operators');

  assert.equal(controller.getState().viewState.operatorsView.mobileStack.at(-1).screen, 'operatorDetail');
});

test('mobile formation list cards expose a delete button and render a distinct list page', () => {
  const controller = createAppController({
    data: createSampleData(),
    viewportWidth: 375,
    savedFormations: createStoredFormations(),
  });

  controller.setMode('formations');

  assert.match(controller.render(), /data-mobile-formation-list-page/);
  assert.match(controller.render(), /data-delete-formation="formation-1"/);
});

test('mobile formation detail and operator detail render as separate pages', () => {
  const controller = createAppController({
    data: createSampleData(),
    viewportWidth: 375,
    savedFormations: createStoredFormations(),
  });

  controller.setMode('formations');
  controller.openMobileFormation('formation-1');
  assert.match(controller.render(), /data-mobile-formation-detail-page/);

  controller.openMobileFormationEntry('formation-1', 'entry-2');
  assert.match(controller.render(), /data-mobile-formation-operator-detail-page/);
});

test('controller returns from formation operator detail without keeping slot highlight', () => {
  const controller = createAppController({
    data: createSampleData(),
    viewportWidth: 375,
    savedFormations: createStoredFormations(),
  });

  controller.setMode('formations');
  controller.openMobileFormation('formation-1');
  controller.openMobileFormationEntry('formation-1', 'entry-2');
  controller.handleBack();

  assert.equal(controller.getState().viewState.formationsView.mobileStack.at(-1).screen, 'formationDetail');
  assert.equal('entryId' in controller.getState().viewState.formationsView.mobileStack.at(-1), false);
});

test('overlay only opens on formationDetail, closes popover on open, and back closes overlay before popping the page', () => {
  const controller = createAppController({
    data: createSampleData(),
    viewportWidth: 375,
    savedFormations: createStoredFormations(),
  });

  controller.setMode('formations');
  controller.openMobileFormation('formation-1');
  controller.toggleBondPopover({
    bondId: 'lateranoShip',
    hostKey: 'formations:mobile:detail:formation-1:bond:lateranoShip',
    anchorRect: { top: 0, left: 0, width: 10, height: 10 },
  });
  controller.openFormationStrategyPicker();

  assert.equal(controller.getState().popoverState.isOpen, false);
  assert.equal(controller.getState().viewState.formationsView.mobileStack.at(-1).overlay, 'strategyPicker');

  controller.handleBack();

  assert.equal(controller.getState().viewState.formationsView.mobileStack.at(-1).screen, 'formationDetail');
  assert.equal(controller.getState().viewState.formationsView.mobileStack.at(-1).overlay, null);
});

test('mode switch and viewport switch both clear mobile overlay and active popover before later rendering', () => {
  const controller = createAppController({
    data: createSampleData(),
    viewportWidth: 375,
    savedFormations: createStoredFormations(),
  });

  controller.setMode('formations');
  controller.openMobileFormation('formation-1');
  controller.toggleBondPopover({
    bondId: 'lateranoShip',
    hostKey: 'formations:mobile:detail:formation-1:bond:lateranoShip',
    anchorRect: { top: 0, left: 0, width: 10, height: 10 },
  });
  controller.openFormationStrategyPicker();
  controller.setMode('operators');

  assert.equal(controller.getState().popoverState.isOpen, false);

  controller.setMode('formations');
  assert.equal(controller.getState().viewState.formationsView.mobileStack.at(-1).overlay, null);

  controller.openFormationStrategyPicker();
  controller.setViewportWidth(1200);
  assert.equal(controller.getState().viewState.formationsView.mobileStack.at(-1).overlay, null);
});

test('deleting the active formation from a deep mobile stack cleans the stack and clears desktop selection when needed', () => {
  const controller = createAppController({
    data: createSampleData(),
    viewportWidth: 375,
    savedFormations: createStoredFormations(),
  });

  controller.setMode('formations');
  controller.openMobileFormation('formation-1');
  controller.openMobileFormationEntry('formation-1', 'entry-2');
  controller.deleteFormation('formation-1');

  assert.deepEqual(controller.getState().viewState.formationsView.mobileStack, [
    { screen: 'formationList', scrollTop: 0 },
  ]);
  controller.setViewportWidth(1200);
  assert.equal(controller.getState().viewState.formationsView.desktopFrame.selectedFormationId, null);
  assert.equal(controller.getState().viewState.formationsView.desktopFrame.selectedEntryId, null);
});

test('legacy persisted formations survive controller hydration and save without leaking view-state fields', () => {
  const calls = [];
  const storage = {
    setItem(key, value) {
      calls.push([key, JSON.parse(value)]);
    },
  };
  const controller = createAppController({
    data: createSampleData(),
    viewportWidth: 1200,
    savedFormations: createStoredFormations(),
  });

  controller.persist(storage);

  assert.equal(calls.length, 1);
  assert.deepEqual(Object.keys(calls[0][1]).sort(), ['formations', 'selectedEntryId', 'selectedFormationId']);
  assert.equal(calls[0][1].selectedFormationId, 'formation-1');
  assert.equal(calls[0][1].selectedEntryId, null);
});

test('controller routes DOM click, input, and change events into the active workspace', () => {
  const desktop = createAppController({
    data: createSampleData(),
    viewportWidth: 1200,
    savedFormations: createStoredFormations(),
  });

  desktop.handleClick({
    target: createClosestTarget({
      '[data-mode-tab]': { dataset: { modeTab: 'formations' } },
    }),
  });
  assert.equal(desktop.getState().viewState.mode, 'formations');

  desktop.handleClick({
    target: createClosestTarget({
      '[data-mode-tab]': null,
      '[data-operator-key]': { dataset: { operatorKey: 'desktop-op' } },
    }),
  });
  assert.equal(desktop.getState().viewState.operatorsView.desktopFrame.selectedOperatorKey, 'desktop-op');

  desktop.handleInput({
    target: createClosestTarget({
      '[data-filter]': { dataset: { filter: 'searchText' }, value: '移动' },
    }),
  });
  assert.equal(desktop.getState().queryState.query.searchText, '移动');

  desktop.handleChange({
    target: createClosestTarget({
      '[data-filter]': { dataset: { filter: 'professionCode' }, value: 'SNIPER' },
    }),
  });
  assert.equal(desktop.getState().queryState.query.professionCode, 'SNIPER');

  const mobile = createAppController({
    data: createSampleData(),
    viewportWidth: 375,
    savedFormations: createStoredFormations(),
  });

  mobile.setMode('formations');
  mobile.handleClick({
    target: createClosestTarget({
      '[data-open-formation]': { dataset: { openFormation: 'formation-1' } },
    }),
  });
  assert.equal(mobile.getState().viewState.formationsView.mobileStack.at(-1).screen, 'formationDetail');
});

test('desktop bond filter opens, applies bond ids, clears them, and closes on outside pointerdown', () => {
  const controller = createAppController({
    data: createSampleData(),
    viewportWidth: 1200,
    savedFormations: createStoredFormations(),
  });

  controller.handleClick({
    target: createClosestTarget({
      '[data-bond-panel-toggle]': { dataset: {} },
    }),
  });

  assert.match(controller.render(), /bond-panel is-open/);

  controller.handleChange({
    target: createClosestTarget({
      '[data-bond-id]': { dataset: { bondId: 'lateranoShip' }, checked: true },
    }),
  });

  assert.deepEqual(controller.getState().queryState.query.bondIds, ['lateranoShip']);

  controller.handleClick({
    target: createClosestTarget({
      '[data-clear-bonds]': { dataset: {} },
    }),
  });

  assert.deepEqual(controller.getState().queryState.query.bondIds, []);
  assert.match(controller.render(), /bond-panel is-open/);

  controller.handleOutsidePointerDown({
    target: createClosestTarget({
      '[data-bond-filter-shell]': null,
    }),
  });

  assert.doesNotMatch(controller.render(), /bond-panel is-open/);
});

test('controller opens a bond popover from DOM click and force-closes it on outside pointerdown', () => {
  const controller = createAppController({
    data: createSampleData(),
    viewportWidth: 375,
    savedFormations: createStoredFormations(),
  });

  controller.setMode('formations');
  controller.openMobileFormation('formation-1');

  const bondButton = {
    dataset: { detailBondId: 'lateranoShip' },
    getBoundingClientRect() {
      return { top: 12, left: 34, width: 56, height: 20 };
    },
  };
  controller.handleClick({
    target: createClosestTarget({
      '[data-detail-bond-id]': bondButton,
    }),
  });

  assert.equal(controller.getState().popoverState.isOpen, true);
  assert.match(controller.render(), /data-bond-popover-panel/);

  controller.handleOutsidePointerDown();

  assert.equal(controller.getState().popoverState.isOpen, false);
});

test('handleOutsidePointerDown does not mutate state when no bond popover is open', () => {
  const controller = createAppController({
    data: createSampleData(),
    viewportWidth: 1200,
    savedFormations: createStoredFormations(),
  });
  let notifications = 0;
  controller.subscribe(() => {
    notifications += 1;
  });

  controller.handleOutsidePointerDown();

  assert.equal(notifications, 0);
});

test('mobile detail pages render a back button and strategy overlay renders strategy choices', () => {
  const controller = createAppController({
    data: createSampleData(),
    viewportWidth: 375,
    savedFormations: createStoredFormations(),
  });

  controller.selectMobileOperator('desktop-op');
  assert.match(controller.render(), /data-back/);

  controller.handleClick({
    target: createClosestTarget({
      '[data-back]': { dataset: { back: '1' } },
    }),
  });
  assert.equal(controller.getState().viewState.operatorsView.mobileStack.at(-1).screen, 'operatorList');

  controller.setMode('formations');
  controller.openMobileFormation('formation-1');
  controller.openFormationStrategyPicker();

  assert.match(controller.render(), /data-formation-strategy="strategy-1"/);
});

test('controller keeps core formation editing actions working through DOM events', () => {
  const controller = createAppController({
    data: createSampleData(),
    viewportWidth: 1200,
    savedFormations: createStoredFormations(),
  });

  controller.setMode('formations');
  controller.handleInput({
    target: createClosestTarget({
      '[data-formation-name]': { value: '新编队名' },
    }),
  });
  controller.handleInput({
    target: createClosestTarget({
      '[data-formation-notes]': { value: '新的备注' },
    }),
  });

  assert.equal(controller.getState().formationsState.formations[0].name, '新编队名');
  assert.equal(controller.getState().formationsState.formations[0].notes, '新的备注');

  controller.selectDesktopOperator('desktop-op');
  controller.handleClick({
    target: createClosestTarget({
      '[data-add-selected-operator]': { dataset: {} },
    }),
  });
  assert.equal(controller.getState().formationsState.formations[0].entries.length, 3);

  controller.handleClick({
    target: createClosestTarget({
      '[data-formation-entry-id]': { dataset: { formationEntryId: 'entry-1' } },
    }),
  });
  controller.handleChange({
    target: createClosestTarget({
      '[data-entry-transfer-bond]': { dataset: { entryTransferBond: 'entry-1' }, value: 'lateranoShip' },
    }),
  });
  assert.equal(controller.getState().formationsState.formations[0].entries[0].transferredBondId, 'lateranoShip');

  controller.handleClick({
    target: createClosestTarget({
      '[data-remove-entry-id]': { dataset: { removeEntryId: 'entry-2' } },
    }),
  });
  assert.equal(controller.getState().formationsState.formations[0].entries.some((entry) => entry.entryId === 'entry-2'), false);
});
