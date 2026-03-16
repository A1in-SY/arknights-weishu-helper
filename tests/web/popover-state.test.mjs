import test from 'node:test';
import assert from 'node:assert/strict';
import {
  closeBondPopover,
  createPopoverState,
  toggleBondPopover,
} from '../../web/popover-state.mjs';

test('toggleBondPopover closes when the same hostKey is clicked twice', () => {
  const state = createPopoverState();
  const opened = toggleBondPopover(state, {
    bondId: 'lateranoShip',
    hostKey: 'operators:desktop:detail:bond:lateranoShip',
    anchorRect: { top: 10, left: 20, width: 30, height: 40 },
  });
  const closed = toggleBondPopover(opened, {
    bondId: 'lateranoShip',
    hostKey: 'operators:desktop:detail:bond:lateranoShip',
    anchorRect: { top: 10, left: 20, width: 30, height: 40 },
  });

  assert.equal(closed.isOpen, false);
});

test('toggleBondPopover replaces the host when the same bond is clicked in another place', () => {
  const state = createPopoverState();
  const opened = toggleBondPopover(state, {
    bondId: 'lateranoShip',
    hostKey: 'operators:desktop:detail:bond:lateranoShip',
    anchorRect: { top: 10, left: 20, width: 30, height: 40 },
  });
  const moved = toggleBondPopover(opened, {
    bondId: 'lateranoShip',
    hostKey: 'formations:desktop:summary:formation-1:bond:lateranoShip',
    anchorRect: { top: 100, left: 50, width: 24, height: 24 },
  });

  assert.equal(moved.hostKey, 'formations:desktop:summary:formation-1:bond:lateranoShip');
  assert.deepEqual(moved.anchorRect, { top: 100, left: 50, width: 24, height: 24 });
});

test('closeBondPopover resets state when controller requests a forced close', () => {
  const state = toggleBondPopover(createPopoverState(), {
    bondId: 'lateranoShip',
    hostKey: 'formations:mobile:detail:formation-1:bond:lateranoShip',
    anchorRect: { top: 1, left: 2, width: 3, height: 4 },
  });

  const closed = closeBondPopover(state);

  assert.equal(closed.isOpen, false);
  assert.equal(closed.hostKey, null);
  assert.equal(closed.bondId, null);
  assert.equal(closed.anchorRect, null);
});
