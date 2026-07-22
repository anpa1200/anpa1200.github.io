#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const siteIndex = args.indexOf('--site');
const siteRoot = siteIndex >= 0 ? resolve(args[siteIndex + 1] || '') : ROOT;
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
addFormats(ajv);

async function validate(name, schemaPath, dataPath) {
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  const data = JSON.parse(await readFile(dataPath, 'utf8'));
  const valid = ajv.validate(schema, data);
  if (!valid) {
    const errors = ajv.errorsText(ajv.errors, { separator: '\n- ', dataVar: name });
    throw new Error(`${name} failed JSON Schema validation:\n- ${errors}`);
  }
  console.log(`${name} passes ${schema.$schema}.`);
}

await validate(
  'content-catalog.json',
  join(ROOT, 'data', 'content-catalog.schema.json'),
  join(siteRoot, 'data', 'content-catalog.json'),
);
await validate(
  'content-catalog.config.json',
  join(ROOT, 'data', 'content-catalog.config.schema.json'),
  join(ROOT, 'data', 'content-catalog.config.json'),
);
await validate(
  'content-taxonomy-audit.json',
  join(ROOT, 'data', 'content-taxonomy-audit.schema.json'),
  join(siteRoot, 'reports', 'content-taxonomy-audit.json'),
);
