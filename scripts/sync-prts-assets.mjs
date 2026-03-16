import { access, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAct2autochessSource } from '../src/export/load-act2autochess-source.mjs';
import { buildOperatorRecords } from '../src/export/build-operator-records.mjs';

const REPO_ROOT = fileURLToPath(new URL('../', import.meta.url));
const PRTS_FILE_REDIRECT_BASE = 'https://prts.wiki/index.php?title=Special:Redirect/file/';

const STRATEGY_NAME_ALIASES = {};

function encodeFileName(fileName) {
  return encodeURIComponent(fileName).replaceAll('%2F', '/');
}

export function buildPrtsFileUrl(fileName) {
  return `${PRTS_FILE_REDIRECT_BASE}${encodeFileName(fileName)}`;
}

export function buildNameCandidates(name) {
  const trimmed = String(name ?? '').trim();

  if (!trimmed) {
    return [];
  }

  return [...new Set([
    trimmed,
    trimmed.replace(/[“”"'`]/g, ''),
  ].filter(Boolean))];
}

export function buildOperatorSourceUrls(operator) {
  return buildNameCandidates(operator.name).flatMap((name) => [
    buildPrtsFileUrl(`头像_${name}.png`),
    buildPrtsFileUrl(`头像_${name}_2.png`),
  ]);
}

export function buildStrategySourceUrls(strategy) {
  const aliasNames = STRATEGY_NAME_ALIASES[strategy.strategyId] ?? [];
  const names = [...buildNameCandidates(strategy.name), ...aliasNames];

  return [...new Set(names.flatMap((name) => [
    buildPrtsFileUrl(`头像_${name}.png`),
    buildPrtsFileUrl(`头像_${name}_2.png`),
  ]))];
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadFirstAvailable(urls, outputPath) {
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          'user-agent': 'arknights-weishu-helper/1.0',
        },
      });

      if (!response.ok) {
        continue;
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.startsWith('image/')) {
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, buffer);
      return { downloaded: true, url };
    } catch {
      // Ignore individual failures and continue with the next candidate.
    }
  }

  return { downloaded: false, url: null };
}

async function syncAsset(items, getOutputPath, getSourceUrls) {
  const summary = {
    downloaded: 0,
    reused: 0,
    missing: [],
  };

  for (const item of items) {
    const outputPath = getOutputPath(item);

    if (await fileExists(outputPath)) {
      summary.reused += 1;
      continue;
    }

    const result = await downloadFirstAvailable(getSourceUrls(item), outputPath);
    if (result.downloaded) {
      summary.downloaded += 1;
      continue;
    }

    summary.missing.push(item);
  }

  return summary;
}

function toAbsoluteOutputPath(localPath) {
  return resolve(REPO_ROOT, `.${localPath}`);
}

export async function syncPrtsAssets() {
  const source = await loadAct2autochessSource();
  const result = buildOperatorRecords(source);
  const operatorSummary = await syncAsset(
    result.operators,
    (operator) => toAbsoluteOutputPath(operator.assets.avatarPath),
    (operator) => buildOperatorSourceUrls(operator),
  );
  const strategySummary = await syncAsset(
    result.strategies,
    (strategy) => toAbsoluteOutputPath(strategy.iconPath),
    (strategy) => buildStrategySourceUrls(strategy),
  );

  return {
    operatorSummary,
    strategySummary,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const summary = await syncPrtsAssets();
  const cachedOperators = summary.operatorSummary.downloaded + summary.operatorSummary.reused;
  const cachedStrategies = summary.strategySummary.downloaded + summary.strategySummary.reused;

  console.log(`operator assets: ${cachedOperators} ready, ${summary.operatorSummary.missing.length} missing`);
  console.log(`strategy assets: ${cachedStrategies} ready, ${summary.strategySummary.missing.length} missing`);

  if (summary.operatorSummary.missing.length > 0 || summary.strategySummary.missing.length > 0) {
    const missingOperatorNames = summary.operatorSummary.missing.map((item) => item.name).join('、');
    const missingStrategyNames = summary.strategySummary.missing.map((item) => item.name).join('、');

    if (missingOperatorNames) {
      console.log(`missing operator assets: ${missingOperatorNames}`);
    }

    if (missingStrategyNames) {
      console.log(`missing strategy assets: ${missingStrategyNames}`);
    }
  }
}
