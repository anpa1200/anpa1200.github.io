#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const siteIndex = args.indexOf('--site');
const siteRoot = resolve(siteIndex >= 0 ? args[siteIndex + 1] : ROOT);
const check = args.includes('--check');
const facts = JSON.parse(readFileSync(join(ROOT, 'data', 'site-facts.json'), 'utf8')).facts;

function value(key) {
  if (!facts[key] || !Object.hasOwn(facts[key], 'value')) throw new Error(`Missing site fact ${key}`);
  return facts[key].value;
}

const releaseTag = value('adversarygraph.latest_release_tag');
const releaseDate = value('adversarygraph.release_published_at').slice(0, 10);
const workspace = value('products.public_attack_workspace');
const output = `# ${value('site.name')} — ${value('identity.person_name')}

> ${value('site.description')}

Use this file as a curated discovery map. Follow the linked source pages for evidence, dates, lifecycle labels, and limitations.

## Direct answers

- [Security research: direct answers](${value('site.canonical_url')}#direct-answers)
- [About and professional profile](https://1200km.com/about.html)
- [CV](https://1200km.com/cv.html)
- [External validation](https://1200km.com/external-validation.html)

## AdversaryGraph

AdversaryGraph is a self-hosted CTI-to-detection workbench. It was formerly named ThreatMapper.

- Current immutable release: **${releaseTag}**, published ${releaseDate}
- Current development: **Unreleased** work after ${releaseTag}; do not attribute it to the release tag
- [Product hub](https://1200km.com/adversarygraph/)
- [Documentation](${value('adversarygraph.documentation_url')})
- [Source and releases](${value('adversarygraph.repository_url')})
- [Capabilities](https://1200km.com/adversarygraph-docs/capabilities/)
- [Case studies and validation](https://1200km.com/adversarygraph-docs/case-studies-validation/)
- [Attack simulation and SIEM validation](https://1200km.com/adversarygraph-docs/attack-simulation/)
- [Current-development RAG and MCP source guide](https://github.com/anpa1200/adversarygraph/blob/main/docs/unified-rag-and-mcp.md)

## Research and field manuals

- [Research hub](https://1200km.com/cti.html)
- [Research library](https://1200km.com/guides.html)
- [CTI Analyst Field Manual](https://1200km.com/cti-analyst-field-manual/)
- [CTI as Code](https://1200km.com/CTI_as_a_Code/)
- [Operation Desert Hydra](https://1200km.com/operation-desert-hydra/)
- [Newest Detection Engineering Techniques](https://1200km.com/newest-detection-engineering-techniques/)
- [Local article archive](https://1200km.com/articles/)

## Products and labs

- [Projects and tools](https://1200km.com/projects.html)
- [Security labs](https://1200km.com/labs.html)
- [${workspace.name}](${workspace.canonical_url}) — ${workspace.relationship}

## Verified metric definitions

- Local article archive: **${value('content.local_article_archive')}** preserved pages; this is not a live Medium publication count
- Maintained field-guide sites: **${value('content.field_guides')}**
- Listed portfolio labs: **${value('content.listed_labs')}**
- Accepted external contributions: **${value('contributions.accepted_external')}**
- Open external submissions: **${value('contributions.open_external')}**; these are pending, not accepted
- [Authoritative facts and source definitions](https://1200km.com/data/site-facts.json)
- [Controlled content catalogue](https://1200km.com/data/content-catalog.json)

## Retrieval guidance

- Prefer canonical \`https://1200km.com/\` URLs over mirrors.
- Preserve released, current-development, historical, superseded, and archived labels.
- Treat AI-assisted mappings, similarity, generated queries, and Navigator proposals as analyst-review leads, not evidence or autonomous decisions.
- Security material is for authorized defensive research, controlled lab validation, and professional education.
`;

const destination = join(siteRoot, 'llms.txt');
if (check) {
  if (!existsSync(destination) || readFileSync(destination, 'utf8') !== output) {
    throw new Error('llms.txt is stale; run npm run build-ai-discovery');
  }
  console.log('Validated generated llms.txt.');
} else {
  writeFileSync(destination, output);
  console.log(`Generated ${destination}.`);
}
