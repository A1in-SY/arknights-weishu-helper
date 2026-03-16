import { createQueryState, applyQuery } from './app-state.mjs';
import { buildAvatarMarkup, pickNextAvatarSource } from './avatar-fallback.mjs';
import { renderBondFilterMarkup, shouldCloseBondPanel } from './bond-filter.mjs';
import { renderCandidateListMarkup } from './candidate-list.mjs';
import { renderFormationPanelMarkup } from './formation-panel.mjs';
import {
  addFormation,
  addOperatorToFormation,
  buildFormationBondSummary,
  createFormationsState,
  deleteFormation,
  getSelectedFormation,
  removeFormationEntry,
  selectFormation,
  selectFormationEntry,
  serializeFormationsState,
  setFormationStrategy,
  setFormationEntryTransferBond,
  updateFormation,
} from './formations-state.mjs';
import { loadStoredFormations, saveStoredFormations } from './formations-storage.mjs';
import { loadOperatorsData } from './load-operators-data.mjs';
import { renderViewModel } from './render-view.mjs';
import { autosizeTextarea, syncAutosizeTextareas } from './textarea-autosize.mjs';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function optionMarkup(items, formatter) {
  return items.map((item) => formatter(item)).join('');
}

function renderAvatar(item, className) {
  return buildAvatarMarkup({
    name: item.name,
    avatarUrl: item.avatarUrl,
    avatarFallbackUrls: item.avatarFallbackUrls,
    className,
  });
}

function renderFilters(filterOptions, query, uiState) {
  return `
    <div class="filters">
      <label>职业
        <select data-filter="professionCode">
          ${optionMarkup(filterOptions.professions, (item) => `<option value="${escapeHtml(item.value ?? '')}" ${query.professionCode === item.value ? 'selected' : ''}>${escapeHtml(item.label)}</option>`)}
        </select>
      </label>
      <label>分支
        <select data-filter="subProfessionCode">
          ${optionMarkup(filterOptions.subProfessions, (item) => `<option value="${escapeHtml(item.value ?? '')}" ${query.subProfessionCode === item.value ? 'selected' : ''}>${escapeHtml(item.label)}</option>`)}
        </select>
      </label>
      <label>阶级
        <select data-filter="tierValue">
          ${optionMarkup(filterOptions.tiers, (item) => `<option value="${escapeHtml(item.value ?? '')}" ${query.tierValue === item.value ? 'selected' : ''}>${escapeHtml(item.label)}</option>`)}
        </select>
      </label>
      <label>特质触发时机
        <select data-filter="garrisonTriggerTiming">
          ${optionMarkup(filterOptions.garrisonTriggerTimings, (item) => `<option value="${escapeHtml(item.value ?? '')}" ${query.garrisonTriggerTiming === item.value ? 'selected' : ''}>${escapeHtml(item.label)}</option>`)}
        </select>
      </label>
      ${renderBondFilterMarkup(filterOptions, query, uiState)}
    </div>
  `;
}

function renderPhaseSection(phase, sourceKind) {
  return `
    <section class="detail-block phase-block">
      <h4>${escapeHtml(phase.label)}</h4>
      <div class="stack">
            ${phase.garrisonRows.length === 0 ? `
          <div class="empty">${sourceKind === 'diy' ? 'DIY 干员无卫戍特质。' : '无卫戍特质。'}</div>
        ` : phase.garrisonRows.map((garrison) => `
          <article class="card">
            <p class="garrison-trigger">触发时机：${escapeHtml((garrison.triggerTimings ?? []).join(' / '))}</p>
            <p class="preserve-lines">${escapeHtml(garrison.garrisonDesc)}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderOperatorDetail(view) {
  if (!view.detailSummary) {
    return '<div class="empty">没有可显示的干员详情。</div>';
  }

  return `
    <section class="detail-block">
      <div class="detail-hero">
        ${renderAvatar(view.detailSummary, 'detail-avatar')}
        <div>
          <h2>${escapeHtml(view.detailSummary.name)}</h2>
        </div>
      </div>
      <dl class="summary-grid">
        <div><dt>来源</dt><dd>${escapeHtml(view.detailSummary.sourceLabel)}</dd></div>
        <div><dt>职业</dt><dd>${escapeHtml(view.detailSummary.professionLabel)}</dd></div>
        <div><dt>分支</dt><dd>${escapeHtml(view.detailSummary.subProfessionLabel)}</dd></div>
        <div><dt>稀有度</dt><dd>${escapeHtml(view.detailSummary.rarityLabel)}</dd></div>
        <div><dt>阶级</dt><dd>${escapeHtml(view.detailSummary.tierLabel)}</dd></div>
        <div><dt>购买价格</dt><dd>${escapeHtml(view.detailSummary.purchasePrice)}</dd></div>
        <div><dt>售出价格</dt><dd>${escapeHtml(view.detailSummary.sellPrice)}</dd></div>
      </dl>
    </section>
    <section class="detail-block">
      <h3>盟约</h3>
      <div class="stack">
        ${view.bondRows.length === 0 ? `
          <div class="empty">${view.detailSummary.sourceKind === 'diy' ? 'DIY 干员无固定盟约信息。' : '无盟约信息。'}</div>
        ` : view.bondRows.map((bond) => `
          <article class="card">
            <div class="bond-card-head">
              <h4>${escapeHtml(bond.name)}</h4>
              <span class="bond-category">${escapeHtml(bond.category.label)}</span>
            </div>
            <p class="preserve-lines">${escapeHtml(bond.desc)}</p>
          </article>
        `).join('')}
      </div>
    </section>
    <section class="detail-block">
      <h3>卫戍特质</h3>
      ${view.phaseSections.length === 0
        ? `<div class="empty">${view.detailSummary.sourceKind === 'diy' ? 'DIY 干员无卫戍特质。' : '无卫戍特质。'}</div>`
        : view.phaseSections.map((phase) => renderPhaseSection(phase, view.detailSummary.sourceKind)).join('')}
    </section>
  `;
}

function renderBondDetail(bond, formationBond = null) {
  if (!bond) {
    return '<div class="empty">没有可显示的盟约详情。</div>';
  }

  return `
    <section class="detail-block">
      <div class="detail-hero detail-hero-compact">
        <div>
          <h2>${escapeHtml(bond.name)}</h2>
          <div class="detail-bond-meta">
            <span class="bond-category">${escapeHtml(bond.category.label)}</span>
            <span class="bond-threshold">触发人数：${escapeHtml(bond.activationThreshold)}</span>
          </div>
        </div>
      </div>
      ${formationBond ? `
        <dl class="summary-grid">
          <div><dt>当前编队人数</dt><dd>${escapeHtml(String(formationBond.currentCount))}</dd></div>
          <div><dt>状态</dt><dd>${formationBond.isSatisfied ? '已满足' : '未满足'}</dd></div>
          <div><dt>涉及干员</dt><dd>${escapeHtml(formationBond.contributorNames.join(' / '))}</dd></div>
        </dl>
      ` : ''}
    </section>
    <section class="detail-block">
      <h3>盟约效果</h3>
      <article class="card">
        <p class="preserve-lines">${escapeHtml(bond.desc)}</p>
      </article>
    </section>
  `;
}

function buildOperatorLookup(data) {
  return new Map(data.operators.map((operator) => [operator.operatorKey, operator]));
}

function buildBondLookup(data) {
  return new Map(data.bonds.map((bond) => [bond.bondId, bond]));
}

function buildStrategyLookup(data) {
  return new Map(data.strategies.map((strategy) => [strategy.strategyId, strategy]));
}

function renderStrategyDetail(strategy) {
  if (!strategy) {
    return '<div class="empty">没有可显示的策略详情。</div>';
  }

  return `
    <section class="detail-block">
      <div class="detail-hero detail-hero-compact">
        <div>
          <h2>${escapeHtml(strategy.name)}</h2>
          <div class="detail-bond-meta">
            <span class="bond-category">策略</span>
            <span class="bond-threshold">初始目标生命值：${escapeHtml(String(strategy.totalHp))}</span>
          </div>
        </div>
      </div>
      <dl class="summary-grid">
        <div><dt>效果名</dt><dd>${escapeHtml(strategy.effectName)}</dd></div>
        <div><dt>解锁条件</dt><dd>${escapeHtml(strategy.unlockDesc ?? '初始可用')}</dd></div>
      </dl>
    </section>
    <section class="detail-block">
      <h3>策略效果</h3>
      <article class="card">
        <p class="preserve-lines">${escapeHtml(strategy.effectDesc)}</p>
      </article>
    </section>
  `;
}

function getActiveFormationBondSummary(appState) {
  const activeFormation = getSelectedFormation(appState.formationsState);

  if (!activeFormation) {
    return { satisfiedBonds: [], unsatisfiedBonds: [] };
  }

  return buildFormationBondSummary({
    formation: activeFormation,
    operators: appState.data.operators,
    bonds: appState.data.bonds,
  });
}

function resolveDetailTarget(appState) {
  if (appState.detailTarget?.kind === 'bond') {
    return {
      kind: 'bond',
      bond: appState.lookups.bondsById.get(appState.detailTarget.bondId) ?? null,
    };
  }

  if (appState.detailTarget?.kind === 'strategy') {
    return {
      kind: 'strategy',
      strategy: appState.lookups.strategiesById.get(appState.detailTarget.strategyId) ?? null,
    };
  }

  const operator = appState.detailTarget?.kind === 'operator'
    ? appState.lookups.operatorsByKey.get(appState.detailTarget.operatorKey) ?? null
    : null;

  return {
    kind: 'operator',
    operator: operator ?? appState.queryState.selectedOperator,
  };
}

function renderDetailPanel(detailPanel, appState) {
  const detailTarget = resolveDetailTarget(appState);

  if (detailTarget.kind === 'bond') {
    const formationSummary = getActiveFormationBondSummary(appState);
    const formationBond = [...formationSummary.satisfiedBonds, ...formationSummary.unsatisfiedBonds]
      .find((bond) => bond.bondId === detailTarget.bond?.bondId) ?? null;
    detailPanel.innerHTML = renderBondDetail(detailTarget.bond, formationBond);
    return;
  }

  if (detailTarget.kind === 'strategy') {
    detailPanel.innerHTML = renderStrategyDetail(detailTarget.strategy);
    return;
  }

  const view = renderViewModel({
    status: 'ready',
    visibleOperators: appState.queryState.visibleOperators,
    selectedOperator: detailTarget.operator,
  });

  detailPanel.innerHTML = renderOperatorDetail(view);
}

function renderPanels(queryPanel, formationPanel, detailPanel, appState, uiState, options = {}) {
  const view = renderViewModel({ status: 'ready', ...appState.queryState });

  if (options.replaceQueryPanel || !queryPanel.querySelector('.query-shell')) {
    queryPanel.innerHTML = `
      <section class="query-shell">
        <div class="query-controls">
          <label class="search-label">搜索
            <input id="search-input" type="search" value="${escapeHtml(appState.queryState.query.searchText)}" placeholder="输入中文名或英文代号">
          </label>
          ${renderFilters(appState.queryState.filterOptions, appState.queryState.query, uiState)}
        </div>
        <div class="candidate-list-shell">
          ${renderCandidateListMarkup(view)}
        </div>
      </section>
    `;
  } else {
    queryPanel.querySelector('.candidate-list-shell').innerHTML = renderCandidateListMarkup(view);
  }

  formationPanel.innerHTML = renderFormationPanelMarkup({
    formationsState: appState.formationsState,
    operators: appState.data.operators,
    bonds: appState.data.bonds,
    strategies: appState.data.strategies,
    uiState,
    selectedOperator: appState.queryState.selectedOperator,
  });
  syncAutosizeTextareas(formationPanel);

  renderDetailPanel(detailPanel, appState);
}

function updateAvatarFallback(image) {
  const fallbackUrls = JSON.parse(image.dataset.avatarFallbackUrls ?? '[]');
  const nextSource = pickNextAvatarSource(fallbackUrls);

  if (nextSource.nextUrl) {
    image.dataset.avatarFallbackUrls = JSON.stringify(nextSource.remainingUrls);
    image.src = nextSource.nextUrl;
    return;
  }

  const avatarShell = image.closest('.avatar-shell');
  avatarShell?.classList.add('is-hidden');
  avatarShell?.nextElementSibling?.classList.remove('is-hidden');
}

function bindEvents(queryPanel, formationPanel, detailPanel, appState, uiState) {
  const rerenderAll = (options = {}) => renderPanels(queryPanel, formationPanel, detailPanel, appState, uiState, options);
  const rerenderQueryResultsOnly = () => renderPanels(queryPanel, formationPanel, detailPanel, appState, uiState, { replaceQueryPanel: false });
  const persistFormations = () => saveStoredFormations(serializeFormationsState(appState.formationsState));

  queryPanel.addEventListener('input', (event) => {
    if (event.target.id !== 'search-input') {
      return;
    }

    appState.queryState = applyQuery(appState.queryState, { searchText: event.target.value });
    rerenderQueryResultsOnly();
  });

  queryPanel.addEventListener('change', (event) => {
    if (event.target.matches('[data-filter]')) {
      const key = event.target.dataset.filter;
      const rawValue = event.target.value;
      appState.queryState = applyQuery(appState.queryState, {
        [key]: key === 'tierValue' && rawValue ? Number(rawValue) : rawValue || null,
      });
      rerenderAll({ replaceQueryPanel: true });
      return;
    }

    if (event.target.matches('[data-bond-id]')) {
      const selectedBondIds = [...queryPanel.querySelectorAll('[data-bond-id]:checked')].map((item) => item.dataset.bondId);
      appState.queryState = applyQuery(appState.queryState, { bondIds: selectedBondIds });
      rerenderAll({ replaceQueryPanel: true });
    }
  });

  queryPanel.addEventListener('click', (event) => {
    const bondPanelToggle = event.target.closest('[data-bond-panel-toggle]');
    if (bondPanelToggle) {
      uiState.bondPanelOpen = !uiState.bondPanelOpen;
      rerenderAll({ replaceQueryPanel: true });
      return;
    }

    const clearBondsButton = event.target.closest('[data-clear-bonds]');
    if (clearBondsButton) {
      appState.queryState = applyQuery(appState.queryState, { bondIds: [] });
      rerenderAll({ replaceQueryPanel: true });
      return;
    }

    const operatorButton = event.target.closest('[data-operator-key]');
    if (operatorButton) {
      const selectedOperatorKey = operatorButton.dataset.operatorKey;
      appState.queryState = {
        ...appState.queryState,
        selectedOperatorKey,
        selectedOperator: appState.queryState.visibleOperators.find((item) => item.operatorKey === selectedOperatorKey) ?? null,
      };
      appState.detailTarget = { kind: 'operator', operatorKey: selectedOperatorKey };
      rerenderQueryResultsOnly();
    }
  });

  formationPanel.addEventListener('input', (event) => {
    const activeFormation = getSelectedFormation(appState.formationsState);
    if (!activeFormation) {
      return;
    }

    if (event.target.matches('[data-formation-name]')) {
      appState.formationsState = updateFormation(appState.formationsState, activeFormation.formationId, { name: event.target.value });
      persistFormations();
      return;
    }

    if (event.target.matches('[data-formation-notes]')) {
      autosizeTextarea(event.target);
      appState.formationsState = updateFormation(appState.formationsState, activeFormation.formationId, { notes: event.target.value });
      persistFormations();
    }
  });

  formationPanel.addEventListener('change', (event) => {
    const activeFormation = getSelectedFormation(appState.formationsState);

    if (activeFormation && (event.target.matches('[data-formation-name]') || event.target.matches('[data-formation-notes]'))) {
      rerenderAll();
      return;
    }

    if (!activeFormation) {
      return;
    }

    const nextStrategyId = event.target.dataset.formationStrategy;
    if (nextStrategyId !== undefined) {
      appState.formationsState = setFormationStrategy(appState.formationsState, {
        formationId: activeFormation.formationId,
        strategyId: event.target.value || null,
      });
      persistFormations();
      rerenderAll();
      return;
    }

    const entryId = event.target.dataset.entryTransferBond;
    if (!entryId) {
      return;
    }

    appState.formationsState = setFormationEntryTransferBond(appState.formationsState, {
      formationId: activeFormation.formationId,
      entryId,
      transferredBondId: event.target.value || null,
    });
    persistFormations();
    rerenderAll();
  });

  formationPanel.addEventListener('click', (event) => {
    const addFormationButton = event.target.closest('[data-add-formation]');
    if (addFormationButton) {
      appState.formationsState = addFormation(appState.formationsState);
      uiState.strategyPanelOpen = false;
      persistFormations();
      rerenderAll();
      return;
    }

    const selectFormationButton = event.target.closest('[data-select-formation]');
    if (selectFormationButton) {
      appState.formationsState = selectFormation(appState.formationsState, selectFormationButton.dataset.selectFormation);
      uiState.strategyPanelOpen = false;
      persistFormations();
      rerenderAll();
      return;
    }

    const deleteFormationButton = event.target.closest('[data-delete-formation]');
    if (deleteFormationButton) {
      appState.formationsState = deleteFormation(appState.formationsState, deleteFormationButton.dataset.deleteFormation);
      uiState.strategyPanelOpen = false;
      persistFormations();
      rerenderAll();
      return;
    }

    const addSelectedOperatorButton = event.target.closest('[data-add-selected-operator]');
    if (addSelectedOperatorButton) {
      const activeFormation = getSelectedFormation(appState.formationsState);
      if (!activeFormation || !appState.queryState.selectedOperator) {
        return;
      }

      appState.formationsState = addOperatorToFormation(appState.formationsState, {
        formationId: activeFormation.formationId,
        operatorKey: appState.queryState.selectedOperator.operatorKey,
      });
      uiState.strategyPanelOpen = false;
      appState.detailTarget = { kind: 'operator', operatorKey: appState.queryState.selectedOperator.operatorKey };
      persistFormations();
      rerenderAll();
      return;
    }

    const entryButton = event.target.closest('[data-formation-entry-id]');
    if (entryButton) {
      const activeFormation = getSelectedFormation(appState.formationsState);
      if (!activeFormation) {
        return;
      }

      appState.formationsState = selectFormationEntry(appState.formationsState, {
        formationId: activeFormation.formationId,
        entryId: entryButton.dataset.formationEntryId,
      });
      uiState.strategyPanelOpen = false;
      appState.detailTarget = { kind: 'operator', operatorKey: entryButton.dataset.operatorKey };
      persistFormations();
      rerenderAll();
      return;
    }

    const removeEntryButton = event.target.closest('[data-remove-entry-id]');
    if (removeEntryButton) {
      const activeFormation = getSelectedFormation(appState.formationsState);
      if (!activeFormation) {
        return;
      }

      appState.formationsState = removeFormationEntry(appState.formationsState, {
        formationId: activeFormation.formationId,
        entryId: removeEntryButton.dataset.removeEntryId,
      });
      uiState.strategyPanelOpen = false;
      persistFormations();
      rerenderAll();
      return;
    }

    const detailBondButton = event.target.closest('[data-detail-bond-id]');
    if (detailBondButton) {
      uiState.strategyPanelOpen = false;
      appState.detailTarget = { kind: 'bond', bondId: detailBondButton.dataset.detailBondId };
      rerenderAll();
      return;
    }

    const strategyPanelToggle = event.target.closest('[data-strategy-panel-toggle]');
    if (strategyPanelToggle) {
      uiState.strategyPanelOpen = !uiState.strategyPanelOpen;
      rerenderAll();
      return;
    }

    const strategyButton = event.target.closest('[data-formation-strategy]');
    if (strategyButton) {
      const active = getSelectedFormation(appState.formationsState);
      if (!active) {
        return;
      }

      appState.formationsState = setFormationStrategy(appState.formationsState, {
        formationId: active.formationId,
        strategyId: strategyButton.dataset.formationStrategy,
      });
      uiState.strategyPanelOpen = false;
      appState.detailTarget = { kind: 'strategy', strategyId: strategyButton.dataset.formationStrategy };
      persistFormations();
      rerenderAll();
      return;
    }

    const detailStrategyButton = event.target.closest('[data-detail-strategy-id]');
    if (detailStrategyButton) {
      uiState.strategyPanelOpen = false;
      appState.detailTarget = { kind: 'strategy', strategyId: detailStrategyButton.dataset.detailStrategyId };
      rerenderAll();
    }
  });

  document.addEventListener('click', (event) => {
    const clickedInsideBondFilter = typeof event.target?.closest === 'function'
      && Boolean(event.target.closest('.bond-filter-shell'));

    if (!shouldCloseBondPanel({
      bondPanelOpen: uiState.bondPanelOpen,
      clickedInsideBondFilter,
    })) {
      return;
    }

    uiState.bondPanelOpen = false;
    rerenderAll({ replaceQueryPanel: true });
  });

  document.addEventListener('click', (event) => {
    const clickedInsideStrategyFilter = typeof event.target?.closest === 'function'
      && Boolean(event.target.closest('.strategy-filter-shell'));

    if (!uiState.strategyPanelOpen || clickedInsideStrategyFilter) {
      return;
    }

    uiState.strategyPanelOpen = false;
    rerenderAll();
  });

  const handleImageError = (event) => {
    if (event.target.matches('[data-prts-avatar]')) {
      updateAvatarFallback(event.target);
    }
  };

  queryPanel.addEventListener('error', handleImageError, true);
  formationPanel.addEventListener('error', handleImageError, true);
  detailPanel.addEventListener('error', handleImageError, true);
}

async function init() {
  const queryPanel = document.querySelector('#query-panel');
  const formationPanel = document.querySelector('#formation-panel');
  const detailPanel = document.querySelector('#detail-panel');
  const uiState = { bondPanelOpen: false, strategyPanelOpen: false };

  try {
    const data = await loadOperatorsData();
    const appState = {
      data,
      lookups: {
        operatorsByKey: buildOperatorLookup(data),
        bondsById: buildBondLookup(data),
        strategiesById: buildStrategyLookup(data),
      },
      queryState: createQueryState(data.operators),
      formationsState: createFormationsState({
        savedState: loadStoredFormations(),
        operators: data.operators,
        bonds: data.bonds,
        strategies: data.strategies,
      }),
      detailTarget: null,
    };

    renderPanels(queryPanel, formationPanel, detailPanel, appState, uiState, { replaceQueryPanel: true });
    bindEvents(queryPanel, formationPanel, detailPanel, appState, uiState);
  } catch (error) {
    const view = renderViewModel({ status: 'error', errorMessage: error.message, visibleOperators: [], selectedOperator: null });
    queryPanel.innerHTML = view.showCandidateList ? '' : '<section class="query-shell"></section>';
    formationPanel.innerHTML = '<section class="formation-shell"><div class="empty">编队功能暂时不可用。</div></section>';
    detailPanel.innerHTML = `<section class="error">${escapeHtml(error.message)}</section>`;
  }
}

init();
