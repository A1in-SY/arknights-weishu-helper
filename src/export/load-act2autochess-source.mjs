import { fileURLToPath } from 'node:url';
import { dirname, resolve, sep } from 'node:path';
import { readJsonFile } from './read-json-file.mjs';

const DEFAULT_DISPLAY_MAPPINGS_PATH = fileURLToPath(
  new URL('../../config/display-mappings.json', import.meta.url),
);
const DEFAULT_DIY_BOND_MAPPINGS_PATH = fileURLToPath(
  new URL('../../config/diy-bond-mappings.json', import.meta.url),
);

function resolveRepositoryRoot() {
  const sourceDir = dirname(fileURLToPath(import.meta.url));
  const worktreeMarker = `${sep}.worktrees${sep}`;
  const markerIndex = sourceDir.indexOf(worktreeMarker);

  if (markerIndex >= 0) {
    return sourceDir.slice(0, markerIndex);
  }

  return resolve(sourceDir, '../..');
}

function resolveGameDataPath(filename) {
  return resolve(resolveRepositoryRoot(), '..', 'ArknightsGameData', 'zh_CN', 'gamedata', 'excel', filename);
}

const DEFAULT_ACTIVITY_TABLE_PATH = resolveGameDataPath('activity_table.json');
const DEFAULT_CHARACTER_TABLE_PATH = resolveGameDataPath('character_table.json');
const DEFAULT_SKIN_TABLE_PATH = resolveGameDataPath('skin_table.json');

export async function loadAct2autochessSource(paths = {}) {
  const activityTablePath = resolve(paths.activityTablePath ?? DEFAULT_ACTIVITY_TABLE_PATH);
  const characterTablePath = resolve(paths.characterTablePath ?? DEFAULT_CHARACTER_TABLE_PATH);
  const displayMappingsPath = resolve(paths.displayMappingsPath ?? DEFAULT_DISPLAY_MAPPINGS_PATH);
  const diyBondMappingsPath = resolve(paths.diyBondMappingsPath ?? DEFAULT_DIY_BOND_MAPPINGS_PATH);
  const skinTablePath = resolve(paths.skinTablePath ?? DEFAULT_SKIN_TABLE_PATH);

  const [activityTable, characters, displayMappings, diyBondMappings, skinTable] = await Promise.all([
    readJsonFile(activityTablePath),
    readJsonFile(characterTablePath),
    readJsonFile(displayMappingsPath),
    readJsonFile(diyBondMappingsPath),
    readJsonFile(skinTablePath),
  ]);

  const activity = activityTable?.activity?.AUTOCHESS_SEASON?.act2autochess;

  if (!activity) {
    throw new Error(`Missing activity.AUTOCHESS_SEASON.act2autochess in ${activityTablePath}`);
  }

  return {
    activityId: 'act2autochess',
    activity,
    bandData: activityTable?.autoChessData?.bandDataDict ?? {},
    characters,
    displayMappings,
    diyBondMappings,
    skins: skinTable?.charSkins ?? {},
  };
}
