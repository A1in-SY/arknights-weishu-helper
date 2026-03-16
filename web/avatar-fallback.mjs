function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function pickAvatarPlaceholder(name) {
  const trimmedName = String(name ?? '').trim();

  if (!trimmedName) {
    return '?';
  }

  return [...trimmedName][0];
}

export function buildAvatarMarkup({ name, avatarUrl, avatarFallbackUrls = [], className }) {
  const placeholder = escapeHtml(pickAvatarPlaceholder(name));

  if (!avatarUrl) {
    return `<span class="${className} avatar-fallback" aria-hidden="true">${placeholder}</span>`;
  }

  const fallbackUrls = JSON.stringify(avatarFallbackUrls);

  return `
    <span class="${className} avatar-shell">
      <img
        class="${className} avatar-image"
        src="${escapeHtml(avatarUrl)}"
        alt="${escapeHtml(name)}"
        data-prts-avatar
        data-avatar-fallback-urls="${escapeHtml(fallbackUrls)}"
        loading="lazy"
      >
    </span>
    <span class="${className} avatar-fallback is-hidden" aria-hidden="true">${placeholder}</span>
  `;
}

export function pickNextAvatarSource(fallbackUrls) {
  const remainingUrls = [...(fallbackUrls ?? [])];
  const nextUrl = remainingUrls.shift() ?? null;

  return {
    nextUrl,
    remainingUrls,
    shouldShowPlaceholder: nextUrl === null,
  };
}
