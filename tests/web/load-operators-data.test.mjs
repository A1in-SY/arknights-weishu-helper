import test from 'node:test';
import assert from 'node:assert/strict';
import { loadOperatorsData } from '../../web/load-operators-data.mjs';

test('loadOperatorsData returns parsed operators payload', async () => {
  const data = await loadOperatorsData(async () => ({
    ok: true,
    json: async () => ({ activityId: 'act2autochess', count: 1, bonds: [{}], strategies: [{}], operators: [{}] }),
  }));

  assert.equal(data.activityId, 'act2autochess');
  assert.equal(data.count, 1);
  assert.equal(data.strategies.length, 1);
});

test('loadOperatorsData throws the fixed blocking message on invalid json', async () => {
  await assert.rejects(
    () => loadOperatorsData(async () => ({ ok: true, json: async () => { throw new Error('bad json'); } })),
    /数据未导出，请先运行导出脚本。/,
  );
});

test('loadOperatorsData treats invalid top-level payload as the same blocking error', async () => {
  await assert.rejects(
    () => loadOperatorsData(async () => ({ ok: true, json: async () => ({ activityId: 'act2autochess', operators: 'bad' }) })),
    /数据未导出，请先运行导出脚本。/,
  );
});

test('loadOperatorsData treats non-ok fetch responses as the same blocking error', async () => {
  await assert.rejects(
    () => loadOperatorsData(async () => ({ ok: false, json: async () => ({}) })),
    /数据未导出，请先运行导出脚本。/,
  );
});
