export function renderFormationDesktopPage({
  listMarkup = '',
  detailMarkup = '',
  operatorMarkup = '',
} = {}) {
  return `
    <section class="desktop-formation-page" data-desktop-formation-page>
      <aside class="desktop-formation-list-panel">
        ${listMarkup}
      </aside>
      <section class="desktop-formation-detail-panel">
        ${detailMarkup}
      </section>
      <aside class="desktop-formation-operator-panel">
        ${operatorMarkup}
      </aside>
    </section>
  `;
}

export function renderFormationMobileListPage({
  listMarkup = '',
} = {}) {
  return `
    <section class="mobile-formation-list-page" data-mobile-formation-list-page>
      <div class="mobile-page-scroll">
        ${listMarkup}
      </div>
    </section>
  `;
}

export function renderFormationMobileDetailPage({
  detailMarkup = '',
} = {}) {
  return `
    <section class="mobile-formation-detail-page" data-mobile-formation-detail-page>
      <div class="mobile-page-scroll">
        <button type="button" class="mobile-back-button" data-back="1">返回</button>
        ${detailMarkup}
      </div>
    </section>
  `;
}

export function renderFormationMobileOperatorDetailPage({
  operatorMarkup = '',
} = {}) {
  return `
    <section class="mobile-formation-operator-detail-page" data-mobile-formation-operator-detail-page>
      <div class="mobile-page-scroll">
        <button type="button" class="mobile-back-button" data-back="1">返回</button>
        ${operatorMarkup}
      </div>
    </section>
  `;
}
