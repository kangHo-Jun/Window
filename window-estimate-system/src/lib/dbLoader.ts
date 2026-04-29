import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  RagConfigurationRow,
  RagPreferenceRuleRow,
  RagPriceRow,
  RagProductRow,
  RagSpaceSizeRow,
} from '@/types/chat';

type CsvRow = Record<string, string>;

const CSV_CACHE = new Map<string, Promise<CsvRow[]>>();

function getCandidatePaths(fileName: string) {
  return [
    path.join(process.cwd(), 'public', fileName),
    path.join(process.cwd(), '..', 'docs', fileName),
  ];
}

async function resolveCsvPath(fileName: string) {
  for (const candidate of getCandidatePaths(fileName)) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error(`CSV 파일을 찾을 수 없습니다: ${fileName}`);
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

async function readCsv(fileName: string) {
  if (!CSV_CACHE.has(fileName)) {
    CSV_CACHE.set(fileName, (async () => {
      const filePath = await resolveCsvPath(fileName);
      const raw = await readFile(filePath, 'utf8');
      const lines = raw
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        return [];
      }

      const headers = parseCsvLine(lines[0]);

      return lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        const row: CsvRow = {};

        headers.forEach((header, index) => {
          row[header] = values[index] ?? '';
        });

        return row;
      });
    })());
  }

  return CSV_CACHE.get(fileName)!;
}

export async function loadConfigurationRows() {
  return (await readCsv('db_configurations_v2.csv')) as RagConfigurationRow[];
}

export async function loadProductRows() {
  return (await readCsv('db_products_v2.csv')) as RagProductRow[];
}

export async function loadPriceRows() {
  return (await readCsv('db_prices_v2.csv')) as RagPriceRow[];
}

export async function loadSpaceSizeRows() {
  return (await readCsv('db_space_size.csv')) as RagSpaceSizeRow[];
}

export async function loadPreferenceRuleRows() {
  return (await readCsv('db_preference_rules.csv')) as RagPreferenceRuleRow[];
}

export async function preloadDbCache() {
  await Promise.all([
    loadConfigurationRows(),
    loadProductRows(),
    loadPriceRows(),
    loadSpaceSizeRows(),
    loadPreferenceRuleRows(),
  ]);
}
