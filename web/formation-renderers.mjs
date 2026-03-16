import {
  MAX_FORMATION_SIZE,
  buildFormationBondSummary,
  getSelectedFormation,
  getSelectedFormationEntry,
} from './formations-state.mjs';
import { buildAvatarMarkup } from './avatar-fallback.mjs';

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

function renderOperatorAvatar(operator, entry, isSelected, { mobile = false } = {}) {
  return `
    <button
      type="button"
      class="formation-entry ${isSelected ? 'is-selected' : ''} ${mobile ? 'is-mobile' : ''}"
      data-formation-entry-id="${escapeHtml(entry.entryId)}"
      data-operator-key="${escapeHtml(entry.operatorKey)}"
    >
      ${buildAvatarMarkup({
        name: operator.name,
        avatarUrl: operator.assets?.avatarPath ?? operator.avatarUrl ?? null,
        avatarFallbackUrls: operator.avatarFallbackUrls ?? [],
        className: 'formation-avatar',
      })}
      <span>${escapeHtml(operator.name)}</span>
    </button>
  `;
}

function renderStrategySummary(strategy) {
  if (!strategy) {
    return '点击选择策略';
  }

  return `${strategy.name} · ${strategy.effectName}`;
}

function renderSelectedStrategy(strategy) {
  if (!strategy) {
    return '<div class="formation-warning">当前编队还没有选择策略。</div>';
  }

  return `
    <section class="formation-selected-strategy">
      <button
        type="button"
        class="formation-selected-strategy-card"
        data-detail-strategy-id="${escapeHtml(strategy.strategyId)}"
        data-strategy-id="${escapeHtml(strategy.strategyId)}"
      >
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

function renderBondSummaryList(items, emptyLabel, { mobile = false } = {}) {
  if (items.length === 0) {
    return `<div class="empty">${escapeHtml(emptyLabel)}</div>`;
  }

  return `
    <div class="formation-bond-list ${mobile ? 'is-mobile' : ''}">
      ${items.map((bond) => `
        <button
          type="button"
          class="formation-bond-chip ${bond.isSatisfied ? 'is-satisfied' : 'is-unsatisfied'}"
          data-detail-bond-id="${escapeHtml(bond.bondId)}"
        >
          <span>${escapeHtml(bond.name)}</span>
          <span>${escapeHtml(`${bond.currentCount}/${bond.activationThreshold}`)}</span>
        </button>
      `).join('')}
    </div>
  `;
}

export function renderFormationListMarkup({ formationsState, mobile = false }) {
  if ((formationsState.formations ?? []).length === 0) {
    return '<div class="empty">当前没有编队。</div>';
  }

  return `
    <section class="formation-list-shell ${mobile ? 'is-mobile' : ''}">
      <div class="formation-toolbar">
        <h2>编队</h2>
        <button type="button" data-add-formation>新建编队</button>
      </div>
      <div class="formation-list">
        ${formationsState.formations.map((formation) => `
          <article class="formation-card ${formation.formationId === formationsState.selectedFormationId ? 'is-selected' : ''}">
            <button
              type="button"
              class="formation-card-main"
              data-select-formation="${escapeHtml(formation.formationId)}"
              data-open-formation="${escapeHtml(formation.formationId)}"
            >
              <strong>${escapeHtml(formation.name)}</strong>
              <span>${escapeHtml(`${formation.entries.length}/${MAX_FORMATION_SIZE}`)}</span>
            </button>
            ${mobile ? `
              <button
                type="button"
                class="formation-card-delete"
                data-delete-formation="${escapeHtml(formation.formationId)}"
              >
                删除
              </button>
            ` : ''}
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

export function renderFormationDetailMarkup({
  formationsState,
  selectedFormationId,
  selectedOperator,
  operators,
  bonds,
  strategies,
  mobile = false,
  strategyPickerOpen = false,
} = {}) {
  const operatorLookup = asOperatorLookup(operators);
  const bondLookup = asBondLookup(bonds);
  const strategyLookup = asStrategyLookup(strategies);
  const formation = getSelectedFormation(formationsState, selectedFormationId);

  if (!formation) {
    return '<div class="empty">当前没有可显示的编队详情。</div>';
  }

  const summary = buildFormationBondSummary({
    formation,
    operators: operatorLookup,
    bonds: [...bondLookup.values()],
  });
  const selectedStrategy = strategyLookup.get(formation.strategyId) ?? null;

  return `
    <section class="formation-detail-shell ${mobile ? 'is-mobile' : ''}">
      <div class="formation-editor-head">
        <label>编队名字
          <input type="text" data-formation-name value="${escapeHtml(formation.name)}" maxlength="40">
        </label>
        ${mobile ? '' : `
          <button type="button" class="formation-danger" data-delete-formation="${escapeHtml(formation.formationId)}">删除编队</button>
        `}
      </div>
      <label>备注
        <textarea data-formation-notes rows="3">${escapeHtml(formation.notes)}</textarea>
      </label>
      <section class="formation-strategy">
        <div class="formation-section-head">
          <h3>策略</h3>
          ${formation.strategyId ? '' : '<span class="formation-required">必选</span>'}
        </div>
        <button type="button" class="strategy-panel-trigger" data-strategy-panel-toggle>
          ${escapeHtml(renderStrategySummary(selectedStrategy))}
        </button>
        ${(!mobile || strategyPickerOpen) ? `
          <div class="strategy-panel">
            <div class="strategy-choice-list">
              ${[...strategyLookup.values()].map((strategy) => `
                <button
                  type="button"
                  class="strategy-choice ${strategy.strategyId === formation.strategyId ? 'is-selected' : ''}"
                  data-formation-strategy="${escapeHtml(strategy.strategyId)}"
                >
                  ${escapeHtml(strategy.name)}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
        ${renderSelectedStrategy(selectedStrategy)}
      </section>
      <div class="formation-actions">
        <button
          type="button"
          data-add-selected-operator
          ${selectedOperator && formation.entries.length < MAX_FORMATION_SIZE ? '' : 'disabled'}
        >
          ${selectedOperator ? `加入当前选中干员：${escapeHtml(selectedOperator.name)}` : '先在干员列表选中一个干员'}
        </button>
        <span>${escapeHtml(`${formation.entries.length}/${MAX_FORMATION_SIZE}`)}</span>
      </div>
      ${summary.requiresPersonnelDocument ? '<div class="formation-warning">该编队需要“人事部文档”道具</div>' : ''}
      <section class="formation-roster ${mobile ? 'is-mobile' : ''}">
        <h3>编队干员</h3>
        <div class="formation-roster-grid">
          ${formation.entries.length === 0
            ? '<div class="empty">当前编队还没有干员。</div>'
            : formation.entries.map((entry) => renderOperatorAvatar(
              operatorLookup.get(entry.operatorKey),
              entry,
              entry.entryId === formationsState.selectedEntryId,
              { mobile },
            )).join('')}
        </div>
      </section>
      <section class="formation-bonds">
        <h3>已满足盟约</h3>
        ${renderBondSummaryList(summary.satisfiedBonds, '当前没有已满足的盟约。', { mobile })}
      </section>
      <section class="formation-bonds">
        <h3>未满足盟约</h3>
        ${renderBondSummaryList(summary.unsatisfiedBonds, '当前没有未满足但已成型的盟约。', { mobile })}
      </section>
    </section>
  `;
}

export function renderFormationOperatorDetailMarkup({
  formationsState,
  selectedFormationId,
  selectedEntryId,
  operators,
  bonds,
} = {}) {
  const operatorLookup = asOperatorLookup(operators);
  const formation = getSelectedFormation(formationsState, selectedFormationId);
  const entry = getSelectedFormationEntry(formationsState, {
    selectedFormationId,
    selectedEntryId,
  });
  const operator = entry ? operatorLookup.get(entry.operatorKey) : null;

  if (!formation || !entry || !operator) {
    return '<div class="empty">点击编队里的干员后，这里会显示详情。</div>';
  }

  return `
    <section class="formation-operator-detail">
      <div class="detail-hero">
        ${buildAvatarMarkup({
          name: operator.name,
          avatarUrl: operator.assets?.avatarPath ?? operator.avatarUrl ?? null,
          avatarFallbackUrls: operator.avatarFallbackUrls ?? [],
          className: 'detail-avatar',
        })}
        <div>
          <h2>${escapeHtml(operator.name)}</h2>
          <p>${escapeHtml(formation.name)}</p>
        </div>
      </div>
      <dl class="summary-grid">
        <div><dt>职业</dt><dd>${escapeHtml(operator.profession?.label ?? '')}</dd></div>
        <div><dt>分支</dt><dd>${escapeHtml(operator.subProfession?.label ?? '')}</dd></div>
        <div><dt>阶级</dt><dd>${escapeHtml(operator.shop?.tier?.label ?? '')}</dd></div>
      </dl>
      <section class="formation-entry-editor">
        <div class="formation-entry-editor-head">
          <strong>${escapeHtml(operator.name)}</strong>
          <button type="button" class="formation-danger" data-remove-entry-id="${escapeHtml(entry.entryId)}">移出编队</button>
        </div>
        <label>盟约转职
          <select data-entry-transfer-bond="${escapeHtml(entry.entryId)}">
            <option value="">无</option>
            ${[...asBondLookup(bonds).values()].map((bond) => `
              <option value="${escapeHtml(bond.bondId)}" ${entry.transferredBondId === bond.bondId ? 'selected' : ''}>
                ${escapeHtml(`${bond.category.label} · ${bond.name}`)}
              </option>
            `).join('')}
          </select>
        </label>
      </section>
    </section>
  `;
}
