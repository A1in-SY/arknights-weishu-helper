import test from 'node:test';
import assert from 'node:assert/strict';
import { mountApp } from '../../web/app.mjs';

function createEventTarget() {
  const listeners = new Map();

  return {
    addEventListener(type, handler) {
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }
      listeners.get(type).add(handler);
    },
    removeEventListener(type, handler) {
      listeners.get(type)?.delete(handler);
    },
    dispatch(type, event = {}) {
      for (const handler of listeners.get(type) ?? []) {
        handler(event);
      }
    },
  };
}

function createWindowFixture(innerWidth) {
  const win = createEventTarget();
  const body = createEventTarget();
  const doc = {
    body,
    defaultView: win,
  };

  body.ownerDocument = doc;
  win.document = doc;
  win.innerWidth = innerWidth;

  return win;
}

function createRootFixture(win) {
  return Object.assign(createEventTarget(), {
    innerHTML: '',
    ownerDocument: win.document,
  });
}

function dispatchResize(win, nextWidth) {
  win.innerWidth = nextWidth;
  win.dispatch('resize', { type: 'resize' });
}

function dispatchPointerDown(body) {
  body.dispatch('pointerdown', { type: 'pointerdown', target: body });
}

function dispatchPointerDownWithTarget(body, target) {
  body.dispatch('pointerdown', { type: 'pointerdown', target });
}

function dispatchClick(root) {
  root.dispatch('click', { type: 'click', target: { closest: () => null } });
}

function dispatchInput(root) {
  root.dispatch('input', { type: 'input', target: { closest: () => null } });
}

function dispatchChange(root) {
  root.dispatch('change', { type: 'change', target: { closest: () => null } });
}

test('mountApp only mounts DOM and forwards browser events into the controller', () => {
  const calls = [];
  const win = createWindowFixture(1200);
  const controller = {
    render: () => '<div data-mounted-app></div>',
    setViewportWidth: (value) => calls.push(['resize', value]),
    handleOutsidePointerDown: () => calls.push(['pointerdown']),
    handleClick: () => calls.push(['click']),
    handleInput: () => calls.push(['input']),
    handleChange: () => calls.push(['change']),
  };
  const root = createRootFixture(win);

  const cleanup = mountApp({ root, controller, win });

  dispatchResize(win, 1100);
  dispatchPointerDown(root.ownerDocument.body);
  dispatchClick(root);
  dispatchInput(root);
  dispatchChange(root);

  assert.match(root.innerHTML, /data-mounted-app/);
  assert.deepEqual(calls, [['resize', 1100], ['pointerdown'], ['click'], ['input'], ['change']]);

  cleanup();
});

test('mountApp does not treat bond trigger clicks as outside-pointer closes', () => {
  const calls = [];
  const win = createWindowFixture(1200);
  const controller = {
    render: () => '<div data-mounted-app></div>',
    handleOutsidePointerDown: () => calls.push('pointerdown'),
  };
  const root = createRootFixture(win);

  const cleanup = mountApp({ root, controller, win });

  dispatchPointerDownWithTarget(root.ownerDocument.body, {
    closest(selector) {
      return selector === '[data-detail-bond-id]' ? {} : null;
    },
  });

  assert.deepEqual(calls, []);

  cleanup();
});
