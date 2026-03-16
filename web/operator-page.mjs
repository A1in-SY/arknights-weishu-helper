export function renderOperatorDesktopPage({
  filterMarkup = '',
  resultsMarkup = '',
  detailMarkup = '',
} = {}) {
  return `
    <section class="desktop-operator-page" data-desktop-operator-page>
      <aside class="desktop-filter-panel">
        ${filterMarkup}
      </aside>
      <section class="desktop-results-panel">
        ${resultsMarkup}
      </section>
      <aside class="desktop-detail-panel">
        ${detailMarkup}
      </aside>
    </section>
  `;
}

export function renderOperatorMobileListPage({
  filterMarkup = '',
  resultsMarkup = '',
} = {}) {
  return `
    <section class="mobile-operator-list-page" data-mobile-operator-list-page>
      <div class="mobile-page-scroll">
        ${filterMarkup}
        ${resultsMarkup}
      </div>
    </section>
  `;
}

export function renderOperatorMobileDetailPage({
  detailMarkup = '',
} = {}) {
  return `
    <section class="mobile-operator-detail-page" data-mobile-operator-detail-page>
      <div class="mobile-page-scroll">
        <button type="button" class="mobile-back-button" data-back="1">返回</button>
        ${detailMarkup}
      </div>
    </section>
  `;
}
