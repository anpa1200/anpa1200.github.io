#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const siteIndex = args.indexOf('--site');
const site = resolve(siteIndex >= 0 ? args[siteIndex + 1] : ROOT);
const modelPath = join(site, 'data', 'adoption-evidence.json');
const schemaPath = join(site, 'data', 'adoption-evidence.schema.json');
const pagePath = join(site, 'external-validation.html');
const failures = [];

for (const path of [modelPath, schemaPath, pagePath]) {
  if (!existsSync(path)) failures.push(`Missing ${path}`);
}

if (!failures.length) {
  const model = JSON.parse(readFileSync(modelPath, 'utf8'));
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  const page = readFileSync(pagePath, 'utf8');
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(model)) failures.push(...validate.errors.map((error) => `${error.instancePath || '/'} ${error.message}`));

  const ids = new Set();
  for (const entry of model.entries || []) {
    if (ids.has(entry.id)) failures.push(`Duplicate evidence ID: ${entry.id}`);
    ids.add(entry.id);
    const publishable = entry.verification_status === 'verified'
      && entry.publication_status === 'published'
      && ['not-required-public-record', 'granted'].includes(entry.permission_status);
    const shown = page.includes(`data-adoption-evidence-id="${entry.id}"`);
    if (shown && !publishable) failures.push(`${entry.id}: non-publishable evidence appears on the public page`);
    if (publishable && !shown) failures.push(`${entry.id}: publishable evidence is absent from External Validation`);
    if (entry.quote && !entry.quote_approved) failures.push(`${entry.id}: an unapproved quote is stored`);
    if (entry.permission_status === 'not-required-public-record' && entry.visibility !== 'independently-public') {
      failures.push(`${entry.id}: public-record permission requires independently-public visibility`);
    }
    if (entry.evidence_type === 'user-submitted-case-study'
      && entry.publication_status === 'published'
      && entry.permission_status !== 'granted') {
      failures.push(`${entry.id}: a published submitted case study requires explicit permission`);
    }
  }

  for (const match of page.matchAll(/data-adoption-evidence-id="([^"]+)"/g)) {
    if (!ids.has(match[1])) failures.push(`External Validation references unknown evidence ${match[1]}`);
  }
}

if (failures.length) {
  console.error(`Adoption evidence validation failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Adoption evidence validation passed: only verified, publication-approved records are public.');
