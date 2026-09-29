#!/usr/bin/env node
// The pinned article archive is static HTML; Docusaurus companions are
// rewritten before build in prepare-companion-source.mjs to preserve hydration.
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { rewriteCrosslinksInDirectory, missingCrosslinkTargets } from './canonical-crosslinks.mjs';

const args = process.argv.slice(2);
const siteIndex = args.indexOf('--site');
assert.ok(siteIndex >= 0 && args[siteIndex + 1], '--site is required');
const site = resolve(args[siteIndex + 1]);
assert.notEqual(site, new URL('..', import.meta.url).pathname, 'Never rewrite the source checkout');
const result = await rewriteCrosslinksInDirectory(resolve(site, 'articles'), ['.html']);
const missing = missingCrosslinkTargets(site);
assert.deepEqual(missing, [], `Crosslink rewrite targets missing from artifact: ${missing.join(', ')}`);
console.log(`Article crosslinks normalized: ${result.replacements} replacement(s) in ${result.files} HTML file(s); ${missing.length} missing targets.`);
