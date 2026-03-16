import { fileURLToPath } from 'node:url';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';

const DEFAULT_OUTPUT_DIR = fileURLToPath(new URL('../../data/act2autochess/', import.meta.url));
const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));

async function writeAtomicJson(path, value) {
  const tempPath = `${path}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(tempPath, path);
}

function getOutputPaths(outputDir = DEFAULT_OUTPUT_DIR) {
  const resolvedOutputDir = resolve(outputDir);

  if (
    !resolvedOutputDir.startsWith(REPO_ROOT) &&
    !resolvedOutputDir.startsWith('/tmp/')
  ) {
    throw new Error(`Unsafe outputDir: ${outputDir}`);
  }

  if (!isAbsolute(resolvedOutputDir)) {
    throw new Error(`Output dir must resolve to an absolute path: ${outputDir}`);
  }

  return {
    operatorsPath: `${resolvedOutputDir}/operators.json`,
    reportPath: `${resolvedOutputDir}/report.json`,
  };
}

export async function cleanupExportFiles(outputDir) {
  const { operatorsPath, reportPath } = getOutputPaths(outputDir);
  await rm(operatorsPath, { force: true });
  await rm(reportPath, { force: true });
}

export async function writeExportFiles(result, outputDir) {
  const { operatorsPath, reportPath } = getOutputPaths(outputDir);

  await mkdir(dirname(operatorsPath), { recursive: true });
  await writeAtomicJson(operatorsPath, {
    activityId: result.activityId,
    count: result.count,
    bonds: result.bonds,
    strategies: result.strategies,
    operators: result.operators,
  });
  await writeAtomicJson(reportPath, result.report);
}

export function getDefaultOutputPaths() {
  return getOutputPaths();
}
