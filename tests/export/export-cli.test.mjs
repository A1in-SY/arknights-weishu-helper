import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { runExport } from '../../scripts/export-act2autochess-operators.mjs';

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function getOutputPaths(outputDir) {
  return {
    operatorsPath: join(outputDir, 'operators.json'),
    reportPath: join(outputDir, 'report.json'),
  };
}

async function seedStaleOutputs(outputDir) {
  const { operatorsPath, reportPath } = getOutputPaths(outputDir);
  await mkdir(dirname(operatorsPath), { recursive: true });
  await writeFile(operatorsPath, '{"stale":true}', 'utf8');
  await writeFile(reportPath, '{"stale":true}', 'utf8');
}

test('runExport writes operators.json and report.json on success', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'act2autochess-export-success-'));
  const outputDir = join(tempDir, 'data');
  const { operatorsPath, reportPath } = getOutputPaths(outputDir);

  const exitCode = await runExport({ outputDir });
  const operators = await readJson(operatorsPath);
  const report = await readJson(reportPath);

  assert.equal(exitCode, 0);
  assert.equal(operators.count, 197);
  assert.equal(operators.bonds.length, 23);
  assert.ok(Array.isArray(operators.strategies));
  assert.ok(operators.strategies.length > 0);
  assert.equal(report.fixedOperatorCount, 116);
  assert.equal(report.bondCount, 23);
  assert.equal(report.diyCandidateCharCount, 81);
  assert.equal(report.diyOperatorCount, 81);
  assert.equal(report.exportedCount, 197);
});

test('runExport removes stale outputs before exiting on failure', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'act2autochess-export-failure-'));
  const outputDir = join(tempDir, 'data');
  const { operatorsPath, reportPath } = getOutputPaths(outputDir);
  await seedStaleOutputs(outputDir);

  const badMappingsDir = await mkdtemp(join(tmpdir(), 'act2autochess-bad-display-'));
  const badDisplayPath = join(badMappingsDir, 'display-mappings.json');
  await writeFile(badDisplayPath, '{"professionLabels":{"SNIPER":"狙击"}}', 'utf8');
  const errors = [];

  const exitCode = await runExport({
    paths: { displayMappingsPath: badDisplayPath },
    outputDir,
    logger: (message) => errors.push(message),
  });

  assert.notEqual(exitCode, 0);
  assert.match(errors[0], /display-mappings\.json|subProfession label|rarity label/);
  await assert.rejects(() => access(operatorsPath, constants.F_OK));
  await assert.rejects(() => access(reportPath, constants.F_OK));
});
