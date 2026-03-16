import { createAppController } from './app-controller.mjs';
import { loadStoredFormations } from './formations-storage.mjs';
import { loadOperatorsData } from './load-operators-data.mjs';

function renderRoot(root, controller) {
  root.innerHTML = controller.render();
}

export function mountApp({ root, controller, win = globalThis.window } = {}) {
  renderRoot(root, controller);

  const unsubscribe = typeof controller.subscribe === 'function'
    ? controller.subscribe(() => renderRoot(root, controller))
    : () => {};

  const handleResize = () => controller.setViewportWidth?.(win.innerWidth);
  const handlePointerDown = (event) => {
    if (
      event.target?.closest?.('[data-bond-id]') ||
      event.target?.closest?.('[data-detail-bond-id]') ||
      event.target?.closest?.('[data-bond-popover-panel]')
    ) {
      return;
    }

    controller.handleOutsidePointerDown?.(event);
  };
  const handleClick = (event) => controller.handleClick?.(event);
  const handleInput = (event) => controller.handleInput?.(event);
  const handleChange = (event) => controller.handleChange?.(event);

  win.addEventListener('resize', handleResize);
  root.ownerDocument.body.addEventListener('pointerdown', handlePointerDown);
  root.addEventListener('click', handleClick);
  root.addEventListener('input', handleInput);
  root.addEventListener('change', handleChange);

  return () => {
    unsubscribe();
    win.removeEventListener('resize', handleResize);
    root.ownerDocument.body.removeEventListener('pointerdown', handlePointerDown);
    root.removeEventListener('click', handleClick);
    root.removeEventListener('input', handleInput);
    root.removeEventListener('change', handleChange);
  };
}

export async function startApp({
  root = globalThis.document?.querySelector?.('[data-app-root]'),
  storage = globalThis.localStorage,
  viewportWidth = globalThis.window?.innerWidth ?? 1200,
} = {}) {
  if (!root) {
    return null;
  }

  const data = await loadOperatorsData();
  const controller = createAppController({
    data,
    viewportWidth,
    savedFormations: loadStoredFormations(storage),
  });

  controller.subscribe?.(() => {
    controller.persist?.(storage);
  });

  mountApp({
    root,
    controller,
    win: globalThis.window,
  });

  return controller;
}

if (globalThis.document?.querySelector?.('[data-app-root]')) {
  startApp().catch((error) => {
    const root = globalThis.document?.querySelector?.('[data-app-root]');
    if (root) {
      root.innerHTML = `<section class="error">${String(error.message ?? error)}</section>`;
    }
  });
}
