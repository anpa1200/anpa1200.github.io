#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const requiredFiles = [
  'llms.txt',
  'agent-index.md',
  'auth.md',
  'data/site-facts.json',
  'data/site-facts.schema.json',
  '_headers',
  '.well-known/api-catalog',
  '.well-known/openapi.json',
  '.well-known/oauth-authorization-server',
  '.well-known/openid-configuration',
  '.well-known/oauth-protected-resource',
  '.well-known/mcp/server-card.json',
  '.well-known/agent-skills/index.json',
  '.well-known/skills/index.json',
  'agent-skills/summarize-portfolio.md',
  'agent-skills/explain-adversarygraph.md',
  'agent-skills/cti-to-detection-context.md',
  'index.md',
  'projects.md',
  'adversarygraph.md',
  'adversarygraph-docs/index.md',
  'adversarygraph-docs/capabilities.md',
  'cti-analyst-field-manual/index.md',
  'israel-government-threat-actors-cti/index.md',
  'assets/webmcp-readonly.js',
  'cloudflare/agent-readiness-worker.js',
  'cloudflare/wrangler.toml.example',
  'cloudflare/dns-aid-records.md',
  'wrangler.toml',
  '.github/workflows/cloudflare-worker.yml',
  '.github/workflows/cloudflare-dns-aid.yml',
  'scripts/cloudflare-upsert-dns-aid.mjs',
];

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

function sha256(rel) {
  return createHash('sha256').update(read(rel)).digest('hex');
}

const failures = [];
for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) failures.push(`Missing ${file}`);
}

for (const file of [
  '.well-known/api-catalog',
  '.well-known/openapi.json',
  '.well-known/oauth-authorization-server',
  '.well-known/openid-configuration',
  '.well-known/oauth-protected-resource',
  '.well-known/mcp/server-card.json',
  '.well-known/agent-skills/index.json',
  '.well-known/skills/index.json',
]) {
  try {
    JSON.parse(read(file));
  } catch (error) {
    failures.push(`Invalid JSON in ${file}: ${error.message}`);
  }
}

const robots = read('robots.txt');
if (!robots.includes('Policy: search=yes, user-triggered AI retrieval=yes, model training=no')) failures.push('robots.txt is missing the documented AI use policy');
for (const agent of ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot']) {
  if (!robots.includes(`User-agent: ${agent}`)) failures.push(`robots.txt is missing search agent ${agent}`);
}
for (const agent of ['GPTBot', 'ClaudeBot', 'Google-Extended']) {
  if (!robots.includes(`User-agent: ${agent}`)) failures.push(`robots.txt is missing training control for ${agent}`);
}
if (!robots.includes('Sitemap: https://1200km.com/sitemap.xml')) failures.push('robots.txt is missing canonical sitemap');

const headers = read('_headers');
for (const expected of [
  '</llms.txt>',
  '</agent-index.md>',
  '</auth.md>',
  '</.well-known/api-catalog>',
  '</.well-known/openapi.json>',
  '</.well-known/mcp/server-card.json>',
  '</.well-known/agent-skills/index.json>',
  '</data/site-facts.json>',
]) {
  if (!headers.includes(expected)) failures.push(`_headers missing ${expected}`);
}

const skills = JSON.parse(read('.well-known/agent-skills/index.json'));
const expectedHashes = {
  'https://1200km.com/agent-skills/summarize-portfolio.md': sha256('agent-skills/summarize-portfolio.md'),
  'https://1200km.com/agent-skills/explain-adversarygraph.md': sha256('agent-skills/explain-adversarygraph.md'),
  'https://1200km.com/agent-skills/cti-to-detection-context.md': sha256('agent-skills/cti-to-detection-context.md'),
};

for (const skill of skills.skills || []) {
  if (expectedHashes[skill.url] !== skill.sha256) {
    failures.push(`Skill hash mismatch for ${skill.name}`);
  }
}

const homepage = read('index.html');
if (!homepage.includes('type="text/markdown" href="/index.md"')) failures.push('Homepage missing markdown alternate link');
if (!homepage.includes('"@type": "Person"')) failures.push('Homepage missing Person JSON-LD');
if (!homepage.includes('/assets/webmcp-readonly.js')) failures.push('Homepage missing read-only WebMCP script');

const adversaryGraph = read('adversarygraph/index.html');
if (!adversaryGraph.includes('type="text/markdown" href="/adversarygraph.md"')) failures.push('AdversaryGraph page missing markdown alternate link');
if (!adversaryGraph.includes('"@type": "SoftwareApplication"')) failures.push('AdversaryGraph page missing SoftwareApplication JSON-LD');
if (!adversaryGraph.includes('/assets/webmcp-readonly.js')) failures.push('AdversaryGraph page missing read-only WebMCP script');

const worker = read('cloudflare/agent-readiness-worker.js');
if (!worker.includes('HOME_LINKS')) failures.push('Cloudflare Worker missing homepage Link header configuration');
if (!worker.includes('text/markdown')) failures.push('Cloudflare Worker missing markdown negotiation support');
if (!worker.includes('JSON_WELL_KNOWN_PATHS')) failures.push('Cloudflare Worker missing well-known JSON content-type fixes');

const wrangler = read('wrangler.toml');
if (!wrangler.includes('1200km.com/*')) failures.push('wrangler.toml missing 1200km.com route');

const auth = read('auth.md');
if (!auth.startsWith('# Auth.md')) failures.push('auth.md missing expected Auth.md heading');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Agent readiness static checks passed.');
