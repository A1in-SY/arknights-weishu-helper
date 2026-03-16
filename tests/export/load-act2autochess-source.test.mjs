import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadAct2autochessSource } from '../../src/export/load-act2autochess-source.mjs';
import { readJsonFile } from '../../src/export/read-json-file.mjs';

test('loadAct2autochessSource returns the season slice and mappings', async () => {
  const source = await loadAct2autochessSource();

  assert.equal(source.activityId, 'act2autochess');
  assert.ok(source.activity.charChessDataDict);
  assert.ok(source.characters);
  assert.equal(source.displayMappings.rarityLabels.TIER_6, '六星');
  assert.equal(source.diyBondMappings.defaultBondId, 'emptyShip');
  assert.equal(source.skins['char_103_angel#1']?.avatarId, 'char_103_angel');
  assert.ok(source.activity.bandDataListDict.band_duyaoy);
  assert.ok(source.activity.effectInfoDataDict.aceffect_band_28);
});

test('loadAct2autochessSource throws when display mappings are missing', async () => {
  await assert.rejects(
    () => loadAct2autochessSource({
      displayMappingsPath: '/tmp/does-not-exist-display-mappings.json',
    }),
    /display-mappings\.json/,
  );
});

test('loadAct2autochessSource fails on missing activity or character tables', async () => {
  await assert.rejects(
    () => loadAct2autochessSource({
      activityTablePath: '/tmp/missing-activity_table.json',
    }),
    /activity_table\.json|missing-activity_table/,
  );
  await assert.rejects(
    () => loadAct2autochessSource({
      characterTablePath: '/tmp/missing-character_table.json',
    }),
    /character_table\.json|missing-character_table/,
  );
});

test('readJsonFile fails on broken JSON with the file path in the error', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'act2autochess-read-json-'));
  const brokenJsonPath = join(tempDir, 'broken.json');

  await writeFile(brokenJsonPath, '{"broken": true,,}', 'utf8');

  await assert.rejects(
    () => readJsonFile(brokenJsonPath),
    /broken\.json|JSON|Unexpected token/,
  );
});
