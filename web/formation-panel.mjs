import { buildAvatarMarkup } from './avatar-fallback.mjs';
import {
  MAX_FORMATION_SIZE,
  buildFormationBondSummary,
  getSelectedFormation,
  getSelectedFormationEntry,
} from './formations-state.mjs';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function asOperatorLookup(operators) {
  return operators instanceof Map
    ? operators
    : new Map((operators ?? []).map((operator) => [operator.operatorKey, operator]));
}

function asBondLookup(bonds) {
  return bonds instanceof Map
    ? bonds
    : new Map((bonds ?? []).map((bond) => [bond.bondId, bond]));
}

function asStrategyLookup(strategies) {
  return strategies instanceof Map
    ? strategies
    : new Map((strategies ?? []).map((strategy) => [strategy.strategyId, strategy]));
}

const KNOWN_INVALID_STRATEGY_ICON_IDS = new Set([
  'band_duyaoy',
]);

function renderFormationAvatar(operator, entry, isSelected) {
  return `
    <button
      class="formation-entry ${isSelected ? 'is-selected' : ''}"
      type="button"
      data-formation-entry-id="${escapeHtml(entry.entryId)}"
      data-operator-key="${escapeHtml(entry.operatorKey)}"
      title="${escapeHtml(operator.name)}"
    >
      ${buildAvatarMarkup({
        name: operator.name,
        avatarUrl: operator.assets?.avatarPath ?? operator.avatarUrl ?? null,
        avatarFallbackUrls: operator.avatarFallbackUrls ?? [],
        className: 'formation-avatar',
      })}
    </button>
  `;
}

function renderBondSummaryList(items, emptyLabel) {
  if (items.length === 0) {
    return `<div class="empty">${escapeHtml(emptyLabel)}</div>`;
  }

  return `
    <div class="formation-bond-list">
      ${items.map((bond) => `
        <button type="button" class="formation-bond-chip ${bond.isSatisfied ? 'is-satisfied' : 'is-unsatisfied'}" data-detail-bond-id="${escapeHtml(bond.bondId)}">
          <span>${escapeHtml(bond.name)}</span>
          <span>${escapeHtml(`${bond.currentCount}/${bond.activationThreshold}`)}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function renderEntryEditor(selectedEntry, operator, bonds) {
  if (!selectedEntry || !operator) {
    return '<div class="empty">选择一个头像后，可设置盟约转职或移出编队。</div>';
  }

  return `
    <section class="formation-entry-editor">
      <div class="formation-entry-editor-head">
        <strong>${escapeHtml(operator.name)}</strong>
        <button type="button" class="formation-danger" data-remove-entry-id="${escapeHtml(selectedEntry.entryId)}">移出编队</button>
      </div>
      <label>盟约转职
        <select data-entry-transfer-bond="${escapeHtml(selectedEntry.entryId)}">
          <option value="">无</option>
          ${bonds.map((bond) => `
            <option value="${escapeHtml(bond.bondId)}" ${selectedEntry.transferredBondId === bond.bondId ? 'selected' : ''}>
              ${escapeHtml(`${bond.category.label} · ${bond.name}`)}
            </option>
          `).join('')}
        </select>
      </label>
    </section>
  `;
}

function renderStrategyChoice(strategy, selectedStrategyId) {
  const isSelected = strategy.strategyId === selectedStrategyId;
  const strategyIconUrl = KNOWN_INVALID_STRATEGY_ICON_IDS.has(strategy.strategyId) ? null : (strategy.iconPath ?? null);

  return `
    <button
      type="button"
      class="strategy-choice ${isSelected ? 'is-selected' : ''}"
      data-formation-strategy="${escapeHtml(strategy.strategyId)}"
      title="${escapeHtml(strategy.name)}"
    >
      ${buildAvatarMarkup({
        name: strategy.name,
        avatarUrl: strategyIconUrl,
        avatarFallbackUrls: [],
        className: 'strategy-icon',
      })}
    </button>
  `;
}

function renderStrategySummary(strategy) {
  if (!strategy) {
    return '点击选择策略';
  }

  return `${strategy.name} · ${strategy.effectName}`;
}

function renderStrategySelector(activeFormation, strategies, selectedStrategy, uiState) {
  return `
    <section class="formation-strategy strategy-filter-shell">
      <div class="formation-section-head">
        <h3>策略</h3>
        ${activeFormation.strategyId ? '' : '<span class="formation-required">必选</span>'}
      </div>
      <button type="button" class="strategy-panel-trigger" data-strategy-panel-toggle>
        ${escapeHtml(renderStrategySummary(selectedStrategy))}
      </button>
      ${uiState?.strategyPanelOpen ? `
        <div class="strategy-panel">
          <div class="strategy-choice-list">
            ${strategies.map((strategy) => renderStrategyChoice(strategy, activeFormation.strategyId)).join('')}
          </div>
        </div>
      ` : ''}
    </section>
  `;
}

function renderSelectedStrategy(strategy) {
  if (!strategy) {
    return '<div class="formation-warning">当前编队还没有选择策略。</div>';
  }

  const strategyIconUrl = KNOWN_INVALID_STRATEGY_ICON_IDS.has(strategy.strategyId) ? null : (strategy.iconPath ?? null);

  return `
    <section class="formation-selected-strategy">
      <button
        type="button"
        class="formation-selected-strategy-card"
        data-detail-strategy-id="${escapeHtml(strategy.strategyId)}"
        data-strategy-id="${escapeHtml(strategy.strategyId)}"
      >
        ${buildAvatarMarkup({
          name: strategy.name,
          avatarUrl: strategyIconUrl,
          avatarFallbackUrls: [],
          className: 'strategy-icon strategy-icon-large',
        })}
        <div class="formation-selected-strategy-copy">
          <div class="formation-selected-strategy-head">
            <strong>${escapeHtml(strategy.name)}</strong>
            <span>初始目标生命值：${escapeHtml(String(strategy.totalHp))}</span>
          </div>
          <div>${escapeHtml(strategy.effectName)}</div>
          <p class="preserve-lines">${escapeHtml(strategy.effectDesc)}</p>
          ${strategy.unlockDesc ? `<p>${escapeHtml(strategy.unlockDesc)}</p>` : ''}
        </div>
      </button>
    </section>
  `;
}

export function renderFormationPanelMarkup({ formationsState, operators, bonds, strategies, selectedOperator, uiState = {} }) {
  const operatorLookup = asOperatorLookup(operators);
  const orderedBonds = bonds instanceof Map ? [...bonds.values()] : [...(bonds ?? [])];
  const orderedStrategies = strategies instanceof Map ? [...strategies.values()] : [...(strategies ?? [])];
  const strategyLookup = asStrategyLookup(orderedStrategies);
  const activeFormation = getSelectedFormation(formationsState, formationsState.selectedFormationId);
  const selectedEntry = getSelectedFormationEntry(formationsState, {
    selectedFormationId: formationsState.selectedFormationId,
    selectedEntryId: formationsState.selectedEntryId,
  });
  const selectedEntryOperator = selectedEntry ? operatorLookup.get(selectedEntry.operatorKey) : null;

  if (!activeFormation) {
    return `
      <section class="formation-shell">
        <div class="formation-toolbar">
          <h2>编队</h2>
          <button type="button" data-add-formation>新建编队</button>
        </div>
        <div class="empty">当前没有编队，先新建一个。</div>
      </section>
    `;
  }

  const summary = buildFormationBondSummary({
    formation: activeFormation,
    operators: operatorLookup,
    bonds: orderedBonds,
  });
  const selectedStrategy = strategyLookup.get(activeFormation.strategyId) ?? null;

  return `
    <section class="formation-shell">
      <div class="formation-toolbar">
        <h2>编队</h2>
        <button type="button" data-add-formation>新建编队</button>
      </div>
      <div class="formation-tabs">
        ${formationsState.formations.map((formation) => `
          <button
            type="button"
            class="formation-tab ${formation.formationId === activeFormation.formationId ? 'is-selected' : ''}"
            data-select-formation="${escapeHtml(formation.formationId)}"
          >
            <span>${escapeHtml(formation.name)}</span>
          </button>
        `).join('')}
      </div>
      <div class="formation-editor">
        <div class="formation-editor-head">
          <label>编队名字
            <input type="text" data-formation-name value="${escapeHtml(activeFormation.name)}" maxlength="40">
          </label>
          <button type="button" class="formation-danger" data-delete-formation="${escapeHtml(activeFormation.formationId)}">删除编队</button>
        </div>
        <label>备注
          <textarea data-formation-notes data-autosize="true" rows="3" placeholder="记录思路、转职原因或替换方案">${escapeHtml(activeFormation.notes)}</textarea>
        </label>
        ${renderStrategySelector(activeFormation, orderedStrategies, selectedStrategy, uiState)}
        ${renderSelectedStrategy(selectedStrategy)}
        <div class="formation-actions">
          <button
            type="button"
            data-add-selected-operator
            ${selectedOperator && activeFormation.entries.length < MAX_FORMATION_SIZE ? '' : 'disabled'}
          >
            ${selectedOperator ? `加入当前选中干员：${escapeHtml(selectedOperator.name)}` : '先在左侧选中一个干员'}
          </button>
          <span>${escapeHtml(`${activeFormation.entries.length}/${MAX_FORMATION_SIZE}`)}</span>
        </div>
        ${summary.requiresPersonnelDocument ? '<div class="formation-warning">该编队需要“人事部文档”道具</div>' : ''}
        <div class="formation-roster">
          ${activeFormation.entries.length === 0
            ? '<div class="empty">当前编队还没有干员。</div>'
            : activeFormation.entries.map((entry) => renderFormationAvatar(
              operatorLookup.get(entry.operatorKey),
              entry,
              entry.entryId === formationsState.selectedEntryId,
            )).join('')}
        </div>
        ${renderEntryEditor(selectedEntry, selectedEntryOperator, orderedBonds)}
        <section class="formation-bonds">
          <h3>已满足盟约</h3>
          ${renderBondSummaryList(summary.satisfiedBonds, '当前没有已满足的盟约。')}
        </section>
        <section class="formation-bonds">
          <h3>未满足盟约</h3>
          ${renderBondSummaryList(summary.unsatisfiedBonds, '当前没有未满足但已成型的盟约。')}
        </section>
      </div>
    </section>
  `;
}
