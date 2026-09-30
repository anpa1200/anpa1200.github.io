#!/usr/bin/env node
// Apply reviewed external-link replacements (data/external-link-replacements.json)
// to href attributes of every staged HTML document. Docusaurus sources are
// already rewritten before their builds; this covers static and generated
// pages (main site, TTP modules, reference library) in the release artifact.
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { externalReplacements, rewriteExternalHrefs, rewriteExternalInDirectory } from './external-link-replacements.mjs';

const args = process.argv.slice(2);
const index = args.indexOf('--site');
assert.ok(index >= 0 && args[index + 1], '--site is required');
const site = resolve(args[index + 1]);
assert.notEqual(site, resolve(new URL('..', import.meta.url).pathname), 'Never rewrite the source checkout');
const result = await rewriteExternalInDirectory(site, ['.html'], rewriteExternalHrefs);
console.log(`External links: ${externalReplacements.size} reviewed replacement(s); rewrote ${result.replacements} href(s) in ${result.files} staged HTML file(s).`);
