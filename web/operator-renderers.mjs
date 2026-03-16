import { renderBondFilterMarkup } from './bond-filter.mjs';
import { renderCandidateListMarkup } from './candidate-list.mjs';
import { buildAvatarMarkup } from './avatar-fallback.mjs';

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

export function renderOperatorFiltersMarkup({ filterOptions, query, uiState = {} }) {
  return `
    <section class="query-filter-shell">
      <label class="search-field">搜索
        <input id="search-input" type="search" value="${escapeHtml(query.searchText)}" placeholder="输入中文名或英文代号" data-filter="searchText">
      </label>
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
    </section>
  `;
}

export function renderOperatorResultsMarkup(view) {
  return `
    <section class="query-results-shell">
      ${renderCandidateListMarkup(view)}
    </section>
  `;
}

export function renderOperatorDetailMarkup(view) {
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
      <div class="operator-bond-list">
        ${view.bondRows.length === 0 ? `
          <div class="empty">${view.detailSummary.sourceKind === 'diy' ? 'DIY 干员无固定盟约信息。' : '无盟约信息。'}</div>
        ` : view.bondRows.map((bond) => `
          <button type="button" class="bond-chip" data-bond-id="${escapeHtml(bond.bondId)}">
            <span>${escapeHtml(bond.name)}</span>
            <span>${escapeHtml(bond.category.label)}</span>
          </button>
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
