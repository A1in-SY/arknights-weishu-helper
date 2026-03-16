import { readFile } from 'node:fs/promises';

export async function readJsonFile(path) {
  let text;

  try {
    text = await readFile(path, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read JSON file: ${path}: ${error.message}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Failed to parse JSON file: ${path}: ${error.message}`);
  }
}
