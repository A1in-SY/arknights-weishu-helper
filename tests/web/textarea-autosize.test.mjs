import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { autosizeTextarea, syncAutosizeTextareas } from '../../web/textarea-autosize.mjs';

test('autosizeTextarea resets height before applying scrollHeight', () => {
  const assignedHeights = [];
  const textarea = {
    scrollHeight: 96,
    style: {
      set height(value) {
        assignedHeights.push(value);
      },
      get height() {
        return assignedHeights.at(-1);
      },
    },
  };

  autosizeTextarea(textarea);

  assert.deepEqual(assignedHeights, ['auto', '96px']);
});

test('syncAutosizeTextareas applies autosize only to marked textareas', () => {
  const autosized = [];
  const firstTextarea = {
    scrollHeight: 64,
    style: {
      set height(value) {
        autosized.push(['first', value]);
      },
    },
  };
  const secondTextarea = {
    scrollHeight: 80,
    style: {
      set height(value) {
        autosized.push(['second', value]);
      },
    },
  };
  const root = {
    querySelectorAll(selector) {
      assert.equal(selector, '[data-autosize="true"]');
      return [firstTextarea, secondTextarea];
    },
  };

  syncAutosizeTextareas(root);

  assert.deepEqual(autosized, [
    ['first', 'auto'],
    ['first', '64px'],
    ['second', 'auto'],
    ['second', '80px'],
  ]);
});

test('formation notes styles disable manual resize and hide overflow', async () => {
  const stylesheet = await readFile(new URL('../../web/styles.css', import.meta.url), 'utf8');

  assert.match(stylesheet, /\.formation-editor textarea\[data-autosize="true"\]\s*\{/);
  assert.match(stylesheet, /resize:\s*none;/);
  assert.match(stylesheet, /overflow:\s*hidden;/);
});
