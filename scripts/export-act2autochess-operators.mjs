import { loadAct2autochessSource } from '../src/export/load-act2autochess-source.mjs';
import { buildOperatorRecords } from '../src/export/build-operator-records.mjs';
import { validateExportResult } from '../src/export/validate-export-result.mjs';
import { cleanupExportFiles, writeExportFiles } from '../src/export/write-export-files.mjs';

export async function runExport(options = {}) {
  const loadSource = options.loadSource ?? loadAct2autochessSource;
  const buildRecords = options.buildRecords ?? buildOperatorRecords;
  const validateResult = options.validateResult ?? validateExportResult;
  const writeFiles = options.writeFiles ?? writeExportFiles;
  const cleanFiles = options.cleanFiles ?? cleanupExportFiles;
  const logger = options.logger ?? console.error;

  try {
    const source = await loadSource(options.paths);
    const result = buildRecords(source);
    validateResult(result);
    await writeFiles(result, options.outputDir);
    return 0;
  } catch (error) {
    await cleanFiles(options.outputDir);
    logger(error.message);
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = await runExport();
  process.exit(exitCode);
}
