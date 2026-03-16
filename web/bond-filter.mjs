function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderBondSummary(bondGroups, selectedBondIds) {
  if (selectedBondIds.length === 0) {
    return '全部盟约';
  }

  const labels = bondGroups
    .flatMap((group) => group.items)
    .filter((item) => selectedBondIds.includes(item.value))
    .map((item) => item.name);

  if (labels.length <= 2) {
    return labels.join(' / ');
  }

  return `${labels.slice(0, 2).join(' / ')} 等${labels.length}项`;
}

export function renderBondFilterMarkup(filterOptions, query, uiState) {
  return `
    <div class="filter-field bond-filter-shell" data-bond-filter-shell>
      <span class="filter-field-label">盟约筛选</span>
      <button class="bond-trigger" type="button" data-bond-panel-toggle aria-expanded="${uiState.bondPanelOpen ? 'true' : 'false'}">
        <strong>${escapeHtml(renderBondSummary(filterOptions.bondGroups, query.bondIds))}</strong>
      </button>
      <div class="bond-panel ${uiState.bondPanelOpen ? 'is-open' : ''}" ${uiState.bondPanelOpen ? '' : 'hidden'}>
        <div class="bond-panel-actions">
          <strong>组合筛选</strong>
          <button type="button" class="bond-clear" data-clear-bonds>清空</button>
        </div>
        ${filterOptions.bondGroups.map((group) => `
          <section class="bond-group">
            <h4>${escapeHtml(group.label)}</h4>
            <div class="bond-options">
              ${group.items.map((item) => `
                <label class="bond-option ${query.bondIds.includes(item.value) ? 'is-selected' : ''}">
                  <input
                    class="bond-option-input"
                    type="checkbox"
                    data-bond-id="${escapeHtml(item.value)}"
                    ${query.bondIds.includes(item.value) ? 'checked' : ''}
                  >
                  <span class="bond-option-copy">${escapeHtml(item.name)}</span>
                </label>
              `).join('')}
            </div>
          </section>
        `).join('')}
      </div>
    </div>
  `;
}

export function shouldCloseBondPanel({ bondPanelOpen, clickedInsideBondFilter }) {
  return bondPanelOpen && !clickedInsideBondFilter;
}
