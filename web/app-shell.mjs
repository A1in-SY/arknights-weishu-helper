function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderModeTab(mode, activeMode) {
  const isActive = mode === activeMode;
  const labels = {
    operators: '干员列表',
    formations: '编队列表',
  };

  return `
    <button
      type="button"
      class="app-mode-tab ${isActive ? 'is-active' : ''}"
      data-mode-tab="${escapeHtml(mode)}"
    >
      ${escapeHtml(labels[mode] ?? mode)}
    </button>
  `;
}

export function renderAppShell({ activeMode = 'operators', pageMarkup = '' } = {}) {
  return `
    <div class="app-shell" data-app-shell data-active-mode="${escapeHtml(activeMode)}">
      <header class="app-topbar">
        <div class="app-topbar-copy">
          <h1>卫戍查询</h1>
          <p>按干员与编队两个视角查看现有内容。</p>
        </div>
        <nav class="app-mode-tabs" aria-label="页面模式">
          ${renderModeTab('operators', activeMode)}
          ${renderModeTab('formations', activeMode)}
        </nav>
      </header>
      <main class="app-page-stage">
        ${pageMarkup}
      </main>
    </div>
  `;
}
