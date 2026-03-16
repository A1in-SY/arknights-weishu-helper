import { buildAvatarMarkup } from './avatar-fallback.mjs';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderCandidateAvatar(item) {
  return buildAvatarMarkup({
    name: item.name,
    avatarUrl: item.avatarUrl,
    avatarFallbackUrls: item.avatarFallbackUrls,
    className: 'candidate-avatar',
  });
}

export function renderCandidateListMarkup(view) {
  if (!view.showCandidateList) {
    return '';
  }

  if (view.candidateItems.length === 0) {
    return '<div class="empty">没有符合条件的干员。</div>';
  }

  return `
    <ul class="candidate-list">
      ${view.candidateItems.map((item) => `
        <li>
          <button class="candidate ${item.isSelected ? 'is-selected' : ''}" data-operator-key="${escapeHtml(item.operatorKey)}">
            <span class="candidate-main">
              ${renderCandidateAvatar(item)}
              <span class="candidate-copy">
                <strong>${escapeHtml(item.name)}</strong>
                <span>${escapeHtml(item.sourceLabel)}</span>
                <span>${escapeHtml(item.tierLabel)}</span>
              </span>
            </span>
          </button>
        </li>
      `).join('')}
    </ul>
  `;
}
