import { applyQuery, createQueryState, getVisibleOperators } from './app-state.mjs';
import { renderAppShell } from './app-shell.mjs';
import {
  addOperatorToFormation,
  createFormationsState,
  deleteFormation as removeFormation,
  removeFormationEntry as dropFormationEntry,
  setFormationEntryTransferBond as updateFormationEntryTransferBond,
  setFormationStrategy as updateFormationStrategy,
  updateFormation as patchFormation,
} from './formations-state.mjs';
import {
  renderFormationDetailMarkup,
  renderFormationListMarkup,
  renderFormationOperatorDetailMarkup,
} from './formation-renderers.mjs';
import {
  renderFormationDesktopPage,
  renderFormationMobileDetailPage,
  renderFormationMobileListPage,
  renderFormationMobileOperatorDetailPage,
} from './formation-page.mjs';
import {
  hydrateStoredFormations,
  saveStoredFormations,
  serializeStoredFormations,
} from './formations-storage.mjs';
import {
  renderOperatorDesktopPage,
  renderOperatorMobileDetailPage,
  renderOperatorMobileListPage,
} from './operator-page.mjs';
import {
  renderOperatorDetailMarkup,
  renderOperatorFiltersMarkup,
  renderOperatorResultsMarkup,
} from './operator-renderers.mjs';
import { renderViewModel } from './render-view.mjs';
import {
  createViewState,
  normalizeViewState,
  openFormationStrategyOverlay,
  pushFormationDetail,
  pushFormationOperatorDetail,
  pushOperatorDetail,
  restoreViewportWorkspace,
} from './view-state.mjs';
import {
  closeBondPopover,
  createPopoverState,
  toggleBondPopover,
} from './popover-state.mjs';

const DESKTOP_MIN_WIDTH = 960;

function getViewport(width) {
  return width >= DESKTOP_MIN_WIDTH ? 'desktop' : 'mobile';
}

function eventTargetClosest(event, selector) {
  return event?.target?.closest?.(selector) ?? null;
}

function toNullableString(value) {
  return value ? String(value) : null;
}

function toNullableNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function anchorRectFromElement(element) {
  const rect = element?.getBoundingClientRect?.();
  if (!rect) {
    return { top: 0, left: 0, width: 0, height: 0 };
  }

  return {
    top: Number(rect.top) || 0,
    left: Number(rect.left) || 0,
    width: Number(rect.width) || 0,
    height: Number(rect.height) || 0,
  };
}

function createLookups(data) {
  return {
    operatorsByKey: new Map(data.operators.map((operator) => [operator.operatorKey, operator])),
    bondsById: new Map(data.bonds.map((bond) => [bond.bondId, bond])),
    strategiesById: new Map(data.strategies.map((strategy) => [strategy.strategyId, strategy])),
  };
}

function normalizeAppState(state) {
  const visibleOperators = getVisibleOperators(state.queryState);

  return {
    ...state,
    viewState: normalizeViewState(state.viewState, {
      visibleOperatorKeys: visibleOperators.map((operator) => operator.operatorKey),
      formations: state.formationsState.formations,
    }),
  };
}

function closeMobileFormationOverlay(viewState) {
  const stack = viewState.formationsView.mobileStack;
  const topFrame = stack.at(-1);

  if (topFrame?.screen !== 'formationDetail' || topFrame.overlay === null) {
    return viewState;
  }

  return {
    ...viewState,
    formationsView: {
      ...viewState.formationsView,
      mobileStack: [
        ...stack.slice(0, -1),
        {
          ...topFrame,
          overlay: null,
        },
      ],
    },
  };
}

function selectOperatorForViewport(state, viewport) {
  const visibleOperators = getVisibleOperators(state.queryState);
  const operatorLookup = new Map(visibleOperators.map((operator) => [operator.operatorKey, operator]));

  if (viewport === 'desktop') {
    return operatorLookup.get(state.viewState.operatorsView.desktopFrame.selectedOperatorKey) ?? null;
  }

  const topFrame = state.viewState.operatorsView.mobileStack.at(-1);
  if (topFrame?.screen !== 'operatorDetail') {
    return null;
  }

  return operatorLookup.get(topFrame.operatorKey) ?? null;
}

function renderOperatorsPage(state, viewport) {
  const visibleOperators = getVisibleOperators(state.queryState);
  const selectedOperator = selectOperatorForViewport(state, viewport);
  const view = renderViewModel({
    status: 'ready',
    visibleOperators,
    selectedOperator,
  });
  const filterMarkup = renderOperatorFiltersMarkup({
    filterOptions: state.queryState.filterOptions,
    query: state.queryState.query,
    uiState: {},
  });
  const resultsMarkup = renderOperatorResultsMarkup(view);
  const detailMarkup = renderOperatorDetailMarkup(view);

  if (viewport === 'desktop') {
    return renderOperatorDesktopPage({
      filterMarkup,
      resultsMarkup,
      detailMarkup,
    });
  }

  const topFrame = state.viewState.operatorsView.mobileStack.at(-1);
  if (topFrame?.screen === 'operatorDetail') {
    return renderOperatorMobileDetailPage({ detailMarkup });
  }

  return renderOperatorMobileListPage({
    filterMarkup,
    resultsMarkup,
  });
}

function buildBondHostKey(state, viewport, bondId) {
  if (state.viewState.mode === 'operators') {
    const selectedOperator = viewport === 'desktop'
      ? state.viewState.operatorsView.desktopFrame.selectedOperatorKey
      : state.viewState.operatorsView.mobileStack.at(-1)?.operatorKey;
    return `operators:${viewport}:${selectedOperator ?? 'none'}:${bondId}`;
  }

  const topFrame = state.viewState.formationsView.mobileStack.at(-1);
  const formationId = topFrame?.formationId ?? state.viewState.formationsView.desktopFrame.selectedFormationId ?? 'none';
  return `formations:${viewport}:${formationId}:${bondId}`;
}

function renderBondPopoverMarkup(state) {
  if (!state.popoverState?.isOpen) {
    return '';
  }

  const bond = state.lookups.bondsById.get(state.popoverState.bondId);
  if (!bond) {
    return '';
  }

  const top = state.popoverState.anchorRect.top + state.popoverState.anchorRect.height + 12;
  const left = state.popoverState.anchorRect.left;

  return `
    <div
      class="bond-popover"
      data-bond-popover-panel
      style="top:${top}px;left:${left}px;"
    >
      <div class="bond-popover-head">
        <strong>${bond.name}</strong>
        <span>${bond.category.label}</span>
      </div>
      <p class="preserve-lines">${bond.desc}</p>
    </div>
  `;
}

function selectFormationForViewport(state, viewport) {
  if (viewport === 'desktop') {
    return state.viewState.formationsView.desktopFrame.selectedFormationId;
  }

  const topFrame = state.viewState.formationsView.mobileStack.at(-1);
  if (topFrame?.screen === 'formationDetail' || topFrame?.screen === 'formationOperatorDetail') {
    return topFrame.formationId;
  }

  return null;
}

function selectFormationEntryForViewport(state, viewport) {
  if (viewport === 'desktop') {
    return state.viewState.formationsView.desktopFrame.selectedEntryId;
  }

  const topFrame = state.viewState.formationsView.mobileStack.at(-1);
  if (topFrame?.screen === 'formationOperatorDetail') {
    return topFrame.entryId;
  }

  return null;
}

function renderFormationsPage(state, viewport) {
  const selectedFormationId = selectFormationForViewport(state, viewport);
  const selectedEntryId = selectFormationEntryForViewport(state, viewport);
  const listMarkup = renderFormationListMarkup({
    formationsState: {
      ...state.formationsState,
      selectedFormationId,
    },
    mobile: viewport === 'mobile',
  });
  const detailMarkup = renderFormationDetailMarkup({
    formationsState: {
      ...state.formationsState,
      selectedEntryId,
    },
    selectedFormationId,
    selectedOperator: selectOperatorForViewport(state, viewport),
    operators: state.data.operators,
    bonds: state.data.bonds,
    strategies: state.data.strategies,
    mobile: viewport === 'mobile',
    strategyPickerOpen: state.viewState.formationsView.mobileStack.at(-1)?.overlay === 'strategyPicker',
  });
  const operatorMarkup = renderFormationOperatorDetailMarkup({
    formationsState: state.formationsState,
    selectedFormationId,
    selectedEntryId,
    operators: state.data.operators,
    bonds: state.data.bonds,
  });

  if (viewport === 'desktop') {
    return renderFormationDesktopPage({
      listMarkup,
      detailMarkup,
      operatorMarkup,
    });
  }

  const topFrame = state.viewState.formationsView.mobileStack.at(-1);
  if (topFrame?.screen === 'formationOperatorDetail') {
    return renderFormationMobileOperatorDetailPage({ operatorMarkup });
  }
  if (topFrame?.screen === 'formationDetail') {
    return renderFormationMobileDetailPage({ detailMarkup });
  }

  return renderFormationMobileListPage({ listMarkup });
}

function createInitialState({ data, viewportWidth = 1200, savedFormations = null }) {
  const hydrated = hydrateStoredFormations({
    savedState: savedFormations,
    operators: data.operators,
    bonds: data.bonds,
    strategies: data.strategies,
  });

  return normalizeAppState({
    data,
    lookups: createLookups(data),
    queryState: createQueryState(data.operators),
    formationsState: hydrated.formationsState ?? createFormationsState({
      operators: data.operators,
      bonds: data.bonds,
      strategies: data.strategies,
    }),
    popoverState: createPopoverState(),
    viewState: createViewState(hydrated.viewStatePatch ?? {}),
    viewportWidth,
  });
}

export function createAppController({ data, viewportWidth = 1200, savedFormations = null } = {}) {
  let state = createInitialState({ data, viewportWidth, savedFormations });
  const listeners = new Set();

  function commit(nextState) {
    state = normalizeAppState(nextState);
    for (const listener of listeners) {
      listener(state);
    }
  }

  return {
    getState() {
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setMode(mode) {
      commit({
        ...state,
        popoverState: closeBondPopover(state.popoverState),
        viewState: {
          ...closeMobileFormationOverlay(state.viewState),
          mode: mode === 'formations' ? 'formations' : 'operators',
        },
      });
    },
    setViewportWidth(nextWidth) {
      const currentViewport = getViewport(state.viewportWidth);
      const nextViewport = getViewport(nextWidth);
      const nextViewState = currentViewport === nextViewport
        ? state.viewState
        : restoreViewportWorkspace(state.viewState, nextViewport);

      commit({
        ...state,
        popoverState: closeBondPopover(state.popoverState),
        viewportWidth: nextWidth,
        viewState: closeMobileFormationOverlay(nextViewState),
      });
    },
    selectDesktopOperator(operatorKey) {
      commit({
        ...state,
        viewState: {
          ...state.viewState,
          operatorsView: {
            ...state.viewState.operatorsView,
            desktopFrame: {
              ...state.viewState.operatorsView.desktopFrame,
              selectedOperatorKey: operatorKey,
            },
          },
        },
      });
    },
    selectMobileOperator(operatorKey) {
      commit({
        ...state,
        viewState: pushOperatorDetail(state.viewState, { operatorKey }),
      });
    },
    openMobileFormation(formationId) {
      commit({
        ...state,
        viewState: pushFormationDetail(state.viewState, { formationId }),
      });
    },
    openMobileFormationEntry(formationId, entryId) {
      commit({
        ...state,
        viewState: pushFormationOperatorDetail(state.viewState, { formationId, entryId }),
      });
    },
    selectDesktopFormation(formationId) {
      commit({
        ...state,
        viewState: {
          ...state.viewState,
          formationsView: {
            ...state.viewState.formationsView,
            desktopFrame: {
              ...state.viewState.formationsView.desktopFrame,
              selectedFormationId: formationId,
              selectedEntryId: null,
            },
          },
        },
      });
    },
    selectDesktopFormationEntry(formationId, entryId) {
      commit({
        ...state,
        viewState: {
          ...state.viewState,
          formationsView: {
            ...state.viewState.formationsView,
            desktopFrame: {
              ...state.viewState.formationsView.desktopFrame,
              selectedFormationId: formationId,
              selectedEntryId: entryId,
            },
          },
        },
      });
    },
    applyQuery(patch) {
      commit({
        ...state,
        queryState: applyQuery(state.queryState, patch),
      });
    },
    toggleBondPopover(payload) {
      commit({
        ...state,
        popoverState: toggleBondPopover(state.popoverState, payload),
      });
    },
    openFormationStrategyPicker() {
      commit({
        ...state,
        popoverState: closeBondPopover(state.popoverState),
        viewState: openFormationStrategyOverlay(state.viewState),
      });
    },
    deleteFormation(formationId) {
      commit({
        ...state,
        formationsState: removeFormation(state.formationsState, formationId),
        popoverState: closeBondPopover(state.popoverState),
        viewState: closeMobileFormationOverlay(state.viewState),
      });
    },
    setFormationStrategy(formationId, strategyId) {
      commit({
        ...state,
        formationsState: updateFormationStrategy(state.formationsState, {
          formationId,
          strategyId,
        }),
        popoverState: closeBondPopover(state.popoverState),
        viewState: closeMobileFormationOverlay(state.viewState),
      });
    },
    updateActiveFormation(patch) {
      const activeFormationId = state.viewState.formationsView.desktopFrame.selectedFormationId;
      if (!activeFormationId) {
        return;
      }

      commit({
        ...state,
        formationsState: patchFormation(state.formationsState, activeFormationId, patch),
      });
    },
    addSelectedOperatorToActiveFormation() {
      const activeFormationId = state.viewState.formationsView.desktopFrame.selectedFormationId;
      const selectedOperator = selectOperatorForViewport(state, getViewport(state.viewportWidth))
        ?? state.lookups.operatorsByKey.get(state.viewState.operatorsView.desktopFrame.selectedOperatorKey)
        ?? null;

      if (!activeFormationId || !selectedOperator) {
        return;
      }

      commit({
        ...state,
        formationsState: addOperatorToFormation(state.formationsState, {
          formationId: activeFormationId,
          operatorKey: selectedOperator.operatorKey,
        }),
      });
    },
    removeFormationEntry(entryId) {
      const activeFormationId = state.viewState.formationsView.desktopFrame.selectedFormationId;
      if (!activeFormationId) {
        return;
      }

      commit({
        ...state,
        formationsState: dropFormationEntry(state.formationsState, {
          formationId: activeFormationId,
          entryId,
        }),
      });
    },
    setFormationEntryTransferBond(entryId, transferredBondId) {
      const activeFormationId = state.viewState.formationsView.desktopFrame.selectedFormationId;
      if (!activeFormationId) {
        return;
      }

      commit({
        ...state,
        formationsState: updateFormationEntryTransferBond(state.formationsState, {
          formationId: activeFormationId,
          entryId,
          transferredBondId,
        }),
      });
    },
    persist(storage = globalThis.localStorage) {
      saveStoredFormations(serializeStoredFormations({
        formationsState: state.formationsState,
        selectedFormationId: state.viewState.formationsView.desktopFrame.selectedFormationId,
        selectedEntryId: state.viewState.formationsView.desktopFrame.selectedEntryId,
      }), storage);
    },
    handleClick(event) {
      const viewport = getViewport(state.viewportWidth);
      const modeButton = eventTargetClosest(event, '[data-mode-tab]');
      if (modeButton) {
        this.setMode(modeButton.dataset.modeTab);
        return;
      }

      const backButton = eventTargetClosest(event, '[data-back]');
      if (backButton) {
        this.handleBack();
        return;
      }

      const formationDeleteButton = eventTargetClosest(event, '[data-delete-formation]');
      if (formationDeleteButton) {
        this.deleteFormation(formationDeleteButton.dataset.deleteFormation);
        return;
      }

      const addSelectedOperatorButton = eventTargetClosest(event, '[data-add-selected-operator]');
      if (addSelectedOperatorButton) {
        this.addSelectedOperatorToActiveFormation();
        return;
      }

      const removeEntryButton = eventTargetClosest(event, '[data-remove-entry-id]');
      if (removeEntryButton) {
        this.removeFormationEntry(removeEntryButton.dataset.removeEntryId);
        return;
      }

      const formationStrategyButton = eventTargetClosest(event, '[data-formation-strategy]');
      if (formationStrategyButton) {
        const activeFormationId = selectFormationForViewport(state, viewport);
        if (activeFormationId) {
          this.setFormationStrategy(activeFormationId, formationStrategyButton.dataset.formationStrategy);
        }
        return;
      }

      const strategyToggle = eventTargetClosest(event, '[data-strategy-panel-toggle]');
      if (strategyToggle) {
        this.openFormationStrategyPicker();
        return;
      }

      const formationOpenButton = eventTargetClosest(event, '[data-open-formation]');
      if (formationOpenButton) {
        if (viewport === 'mobile') {
          this.openMobileFormation(formationOpenButton.dataset.openFormation);
        } else {
          this.selectDesktopFormation(formationOpenButton.dataset.openFormation);
        }
        return;
      }

      const formationSelectButton = eventTargetClosest(event, '[data-select-formation]');
      if (formationSelectButton) {
        this.selectDesktopFormation(formationSelectButton.dataset.selectFormation);
        return;
      }

      const formationEntryButton = eventTargetClosest(event, '[data-formation-entry-id]');
      if (formationEntryButton) {
        const activeFormationId = selectFormationForViewport(state, viewport);
        if (!activeFormationId) {
          return;
        }

        if (viewport === 'mobile' && state.viewState.mode === 'formations') {
          this.openMobileFormationEntry(activeFormationId, formationEntryButton.dataset.formationEntryId);
        } else {
          this.selectDesktopFormationEntry(activeFormationId, formationEntryButton.dataset.formationEntryId);
        }
        return;
      }

      const detailBondButton = eventTargetClosest(event, '[data-detail-bond-id]');
      if (detailBondButton) {
        this.toggleBondPopover({
          bondId: detailBondButton.dataset.detailBondId,
          hostKey: buildBondHostKey(state, viewport, detailBondButton.dataset.detailBondId),
          anchorRect: anchorRectFromElement(detailBondButton),
        });
        return;
      }

      const bondButton = eventTargetClosest(event, '[data-bond-id]');
      if (bondButton) {
        this.toggleBondPopover({
          bondId: bondButton.dataset.bondId,
          hostKey: buildBondHostKey(state, viewport, bondButton.dataset.bondId),
          anchorRect: anchorRectFromElement(bondButton),
        });
        return;
      }

      const operatorButton = eventTargetClosest(event, '[data-operator-key]');
      if (operatorButton) {
        if (viewport === 'mobile') {
          this.selectMobileOperator(operatorButton.dataset.operatorKey);
        } else {
          this.selectDesktopOperator(operatorButton.dataset.operatorKey);
        }
        return;
      }
    },
    handleInput(event) {
      const formationNameField = eventTargetClosest(event, '[data-formation-name]');
      if (formationNameField) {
        this.updateActiveFormation({ name: formationNameField.value });
        return;
      }

      const formationNotesField = eventTargetClosest(event, '[data-formation-notes]');
      if (formationNotesField) {
        this.updateActiveFormation({ notes: formationNotesField.value });
        return;
      }

      const filterField = eventTargetClosest(event, '[data-filter]');
      if (!filterField) {
        return;
      }

      if (filterField.dataset.filter === 'searchText') {
        this.applyQuery({ searchText: filterField.value });
      }
    },
    handleChange(event) {
      const transferBondField = eventTargetClosest(event, '[data-entry-transfer-bond]');
      if (transferBondField) {
        this.setFormationEntryTransferBond(
          transferBondField.dataset.entryTransferBond,
          toNullableString(transferBondField.value),
        );
        return;
      }

      const filterField = eventTargetClosest(event, '[data-filter]');
      if (!filterField) {
        return;
      }

      const key = filterField.dataset.filter;
      if (key === 'searchText') {
        this.applyQuery({ searchText: filterField.value });
        return;
      }

      if (key === 'tierValue') {
        this.applyQuery({ tierValue: toNullableNumber(filterField.value) });
        return;
      }

      this.applyQuery({ [key]: toNullableString(filterField.value) });
    },
    handleOutsidePointerDown() {
      commit({
        ...state,
        popoverState: closeBondPopover(state.popoverState),
      });
    },
    handleBack() {
      if (getViewport(state.viewportWidth) !== 'mobile') {
        return false;
      }

      if (state.viewState.mode === 'operators') {
        const stack = state.viewState.operatorsView.mobileStack;
        if (stack.at(-1)?.screen !== 'operatorDetail') {
          return false;
        }

        commit({
          ...state,
          viewState: {
            ...state.viewState,
            operatorsView: {
              ...state.viewState.operatorsView,
              mobileStack: stack.slice(0, -1),
            },
          },
        });
        return true;
      }

      if (state.viewState.mode === 'formations') {
        const stack = state.viewState.formationsView.mobileStack;
        const topFrame = stack.at(-1);
        if (topFrame?.screen === 'formationDetail' && topFrame.overlay === 'strategyPicker') {
          commit({
            ...state,
            viewState: closeMobileFormationOverlay(state.viewState),
          });
          return true;
        }
        if (topFrame?.screen === 'formationOperatorDetail' || topFrame?.screen === 'formationDetail') {
          commit({
            ...state,
            viewState: {
              ...state.viewState,
              formationsView: {
                ...state.viewState.formationsView,
                mobileStack: stack.slice(0, -1),
              },
            },
          });
          return true;
        }
      }

      return false;
    },
    render() {
      const viewport = getViewport(state.viewportWidth);
      const pageMarkup = state.viewState.mode === 'formations'
        ? renderFormationsPage(state, viewport)
        : renderOperatorsPage(state, viewport);

      return renderAppShell({
        activeMode: state.viewState.mode,
        pageMarkup: `${pageMarkup}${renderBondPopoverMarkup(state)}`,
      });
    },
  };
}
