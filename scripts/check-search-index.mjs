#!/usr/bin/env node
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { rerankSearchResults } from './search-governance-lib.mjs';
import {
  LOCAL_SEARCH_MINIMUM_PAGES,
  REMOTE_SEARCH_MINIMUM_PAGES,
} from './search-index-lib.mjs';

const args = process.argv.slice(2);
const bundleIndex = args.indexOf('--bundle');
const bundle = resolve(bundleIndex >= 0 ? args[bundleIndex + 1] : 'pagefind');
const remote = args.includes('--remote');
const minimumPages = remote ? REMOTE_SEARCH_MINIMUM_PAGES : LOCAL_SEARCH_MINIMUM_PAGES;
const required = [
  'pagefind.js',
  'pagefind-component-ui.js',
  'pagefind-component-ui.css',
  'pagefind-worker.js',
  'pagefind-entry.json',
  'search-build.json',
  'search-governance.json',
  'wasm.en.pagefind',
];
const failures = [];

for (const file of required) {
  const path = join(bundle, file);
  if (!existsSync(path) || statSync(path).size === 0) failures.push(`missing or empty ${file}`);
}

let build;
let governance;
try {
  build = JSON.parse(readFileSync(join(bundle, 'search-build.json'), 'utf8'));
  if (build.pagefindVersion !== '1.5.2') failures.push(`expected Pagefind 1.5.2, found ${build.pagefindVersion}`);
  if (build.indexedPages < minimumPages) failures.push(`expected at least ${minimumPages} indexed pages, found ${build.indexedPages}`);
  if (build.indexedCustomRecords < 125 || build.knowledgeSourceRecords !== build.indexedCustomRecords) {
    failures.push(`expected at least 125 consistently reported knowledge-source records, found ${build.indexedCustomRecords || 0}`);
  }
  if (build.indexedPageRecords < Math.floor(build.indexedPages * 0.95) || build.indexedPageRecords > build.indexedPages) {
    failures.push(`searchable page-record coverage disagrees with accepted pages: ${build.indexedPageRecords}/${build.indexedPages}`);
  }
  if (build.indexedRecords !== build.indexedPageRecords + build.indexedCustomRecords) {
    failures.push('indexed record total disagrees with searchable page and custom-record counts');
  }
  if (build.knowledgeSourceModuleUrl !== 'https://1200km.com/cyber-knowledge/knowledge-sources/') {
    failures.push(`unexpected knowledge-source module URL: ${build.knowledgeSourceModuleUrl || '(missing)'}`);
  }
  if (build.failedPages > (remote ? 12 : 0)) failures.push(`too many failed pages: ${build.failedPages}`);
  if ((build.skipped?.['stale-sitemap-url'] || 0) !== 0) failures.push(`stale sitemap URLs were indexed: ${build.skipped['stale-sitemap-url']}`);
  if (remote && build.canonicalSitemapPages !== build.indexedPages) failures.push('canonical sitemap coverage does not match the Pagefind index');
  if (Number.isInteger(build.totalSitemapEntries)
    && build.totalSitemapEntries !== build.indexedPages + (build.auxiliarySitemapPages || 0)) {
    failures.push('total sitemap coverage disagrees with indexed and auxiliary discovery URLs');
  }
} catch (error) {
  failures.push(`invalid search-build.json: ${error.message}`);
}
try {
  governance = JSON.parse(readFileSync(join(bundle, 'search-governance.json'), 'utf8'));
  if (governance.schema_version !== 1) failures.push(`unsupported search-governance schema ${governance.schema_version}`);
  if (governance.accepted_page_count !== build?.indexedPages) failures.push(`search governance targets ${governance.accepted_page_count} of ${build?.indexedPages} accepted pages`);
  if (governance.indexed_page_count !== build?.indexedPageRecords) failures.push(`search governance targets ${governance.indexed_page_count} of ${build?.indexedPageRecords} searchable page records`);
  if (governance.indexed_custom_record_count !== build?.indexedCustomRecords) failures.push(`search governance targets ${governance.indexed_custom_record_count} of ${build?.indexedCustomRecords} custom records`);
  if (governance.indexed_record_count !== build?.indexedRecords) failures.push(`search governance targets ${governance.indexed_record_count} of ${build?.indexedRecords} total records`);
  if (governance.record_count < Math.floor((build?.indexedRecords || 0) * 0.95)) failures.push(`search governance has too few Pagefind fragment records: ${governance.record_count}`);
  if (Object.keys(governance.records || {}).length !== governance.record_count) failures.push('search governance record_count disagrees with its records');
} catch (error) {
  failures.push(`invalid search-governance.json: ${error.message}`);
}

const mime = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pagefind': 'application/octet-stream',
  '.pf_fragment': 'application/octet-stream',
  '.pf_index': 'application/octet-stream',
};

function safeBundlePath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://127.0.0.1').pathname).replace(/^\/+/, '');
  const path = resolve(bundle, pathname);
  return path.startsWith(`${bundle}/`) ? path : null;
}

async function checkQueries() {
  const server = createServer((request, response) => {
    const file = safeBundlePath(request.url || '/');
    if (!file || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    response.end(readFileSync(file));
  });
  await new Promise((resolvePromise) => server.listen(0, '127.0.0.1', resolvePromise));
  const address = server.address();
  const basePath = `http://127.0.0.1:${address.port}/`;

  try {
    const module = await import(`${pathToFileURL(join(bundle, 'pagefind.js')).href}?check=${Date.now()}`);
    const search = module.createInstance({
      basePath,
      baseUrl: '/',
      language: 'en',
      noWorker: true,
      ranking: {
        pageLength: 0.5,
        termFrequency: 0.8,
        termSimilarity: 1,
        metaWeights: { title: 10, identifier: 20, aliases: 12, description: 3, collection: 2 },
      },
    });
    await search.init();
    const filters = await search.filters();
    for (const filter of ['content_type', 'primary_type', 'primary_domain', 'audience', 'status', 'lifecycle', 'evidence_level', 'collection_tier', 'version', 'source', 'updated_year', 'topic', 'section']) {
      const minimumValues = filter === 'updated_year' ? 1 : 2;
      if (!filters[filter] || Object.keys(filters[filter]).length < minimumValues) failures.push(`search filter ${filter} is missing or incomplete`);
    }
    for (const filter of ['knowledge_category', 'knowledge_tag', 'knowledge_access', 'knowledge_source_kind', 'knowledge_quality_tier', 'knowledge_maintenance', 'knowledge_evidence_use', 'knowledge_skill_level', 'knowledge_validation_status', 'knowledge_provenance', 'knowledge_audience', 'knowledge_format', 'knowledge_organization']) {
      if (!filters[filter] || Object.keys(filters[filter]).length < 2) failures.push(`knowledge-source search filter ${filter} is missing or incomplete`);
    }
    const checks = [
      { query: 'T1059.003', expectedPrefixes: ['/threat-matrix/techniques/T1059.003/'], first: true, matchedTier: 'reference', matchedSource: 'MITRE ATT&CK', matchedType: 'generated-reference', matchedLifecycle: 'stable-reference' },
      { query: 'T1059.00', expectedPrefixes: ['/threat-matrix/techniques/T1059.0'], first: true, matchedTier: 'reference' },
      { query: 'G0034', expectedPrefixes: ['/threat-matrix/actors/G0034/'], first: true, matchedTier: 'reference', matchedSource: 'MITRE ATT&CK', matchedType: 'reference-entity', matchedLifecycle: 'stable-reference' },
      { query: 'G0069', expectedPrefixes: ['/threat-matrix/actors/G0069/'], first: true, matchedTier: 'reference' },
      { query: 'MuddyWater', expectedPrefixes: ['/threat-matrix/actors/G0069/'] },
      { query: 'Kerberoasting', expectedPrefixes: ['/ITDR/'] },
      { query: 'Kerberosting', expectedPrefixes: ['/ITDR/'] },
      { query: 'AdversaryGraph', expectedPrefixes: ['/adversarygraph/', '/adversarygraph-docs/'], requiredTier: 'core' },
      { query: 'Operation Desert Hydra', expectedPrefixes: ['/operation-desert-hydra/', '/labs.html'], expectedUrls: ['/'], requiredTier: 'core' },
      { query: 'RAG MCP', expectedPrefixes: ['/adversarygraph', '/ai-offensive.html'] },
      { query: 'AIDebug', expectedPrefixes: ['/external-validation.html', '/labs.html', '/ai-offensive.html'] },
      // The completed learning record and full narrative review are distinct
      // resources for the same course title. Keep the current record in the
      // first two results without suppressing the deeper review article.
      { query: 'TrainSec Malware Analyst Professional Level 1', expectedPrefixes: ['/courses/trainsec-malware-analyst-professional-level-1/'], maxRank: 2, requiredTier: 'core' },
      // Each archived full narrative and completed canonical course chapter are
      // distinct resources with the same title. Keep each maintained chapter in
      // the first two results without suppressing its archived publication.
      { query: 'AI Security Course Module 00 Chapter 3 Neural Networks and Optimization', expectedPrefixes: ['/ai-security-course/module-00/chapter-03.html'], maxRank: 2, matchedTier: 'reference', matchedSource: 'Medium', matchedType: 'guide', matchedLifecycle: 'maintained' },
      { query: 'AI Security Course Module 00 Chapter 4 Transformers and LLM Generation', expectedPrefixes: ['/ai-security-course/module-00/chapter-04.html'], maxRank: 2, matchedTier: 'reference', matchedSource: 'Medium', matchedType: 'guide', matchedLifecycle: 'maintained' },
      { query: 'detection validation', expectedPrefixes: ['/adversarygraph', '/labs.html', '/newest-detection-engineering-techniques/'] },
      { query: 'IOC enrichment', expectedPrefixes: ['/adversarygraph'], requiredTier: 'core' },
      {
        query: 'CISA Known Exploited Vulnerabilities Catalog',
        expectedUrls: ['/cyber-knowledge/knowledge-sources/#source-cisa-known-exploited-vulnerabilities-catalog'],
        expectedPrefixes: [],
        first: true,
        matchedTier: 'reference',
        matchedSource: '1200km Knowledge Sources',
        matchedType: 'reference-entity',
        matchedLifecycle: 'stable-reference',
        matchedContentType: 'Knowledge source',
        matchedSection: 'Cyber Knowledge',
        matchedKnowledgeCategory: 'vulnerability',
        matchedKnowledgeTag: 'vulnerability-management',
      },
      {
        query: 'PortSwigger Web Security Academy',
        expectedUrls: ['/cyber-knowledge/knowledge-sources/#source-portswigger-web-security-academy'],
        expectedPrefixes: [],
        first: true,
        matchedContentType: 'Knowledge source',
        matchedSection: 'Cyber Knowledge',
        matchedKnowledgeCategory: 'training',
        matchedKnowledgeTag: 'web-security',
      },
      // Generic ecosystem terms may legitimately rank the homepage or flagship
      // platform ahead of the domain guide. Require the guide in the result set,
      // while reserving strict first-place assertions for identifiers and
      // unambiguous guide titles.
      { query: 'threat intelligence', expectedPrefixes: ['/cyber-knowledge/cti.html'], broad: true, requiredTier: 'core' },
      { query: 'red team', expectedPrefixes: ['/cyber-knowledge/red-team.html'], first: true, broad: true, requiredTier: 'core' },
      { query: 'blue team', expectedPrefixes: ['/cyber-knowledge/blue-team.html'], first: true, broad: true, requiredTier: 'core' },
      { query: 'vulnerability research', expectedPrefixes: ['/cyber-knowledge/vulnerability-research.html'], first: true, broad: true, requiredTier: 'core' },
      { query: 'application security', expectedPrefixes: ['/cyber-knowledge/secure-code.html'], first: true, broad: true, requiredTier: 'core' },
      { query: 'incident response', expectedPrefixes: ['/cyber-knowledge/dfir.html'], first: true, broad: true, requiredTier: 'core' },
      { query: 'cloud security', expectedPrefixes: ['/cyber-knowledge/cloud-security.html'], first: true, broad: true, requiredTier: 'core' },
      { query: 'AI security field guide prompt injection MCP', expectedPrefixes: ['/cyber-knowledge/ai-security.html'], first: true, broad: true, requiredTier: 'core' },
      { query: 'cybersecurity governance', expectedPrefixes: ['/cyber-knowledge/grc.html'], broad: true, requiredTier: 'core' },
      { query: 'OSINT reconnaissance', expectedPrefixes: ['/cyber-knowledge/osint.html'], first: true, broad: true, requiredTier: 'core' },
      { query: 'malware analysis', expectedPrefixes: ['/cyber-knowledge/malware-analysis.html'], first: true, broad: true, requiredTier: 'core' },
      { query: 'Historical AdversaryGraph v4 Capability Map', expectedPrefixes: ['/articles/adversarygraph-v2-self-hosted-ai-cti-platform.html'], requiredTier: 'archive', matchedLifecycle: 'superseded' },
    ];
    for (const {
      query,
      expectedPrefixes,
      expectedUrls = [],
      first = false,
      maxRank = null,
      matchedTier,
      matchedSource,
      matchedType,
      matchedLifecycle,
      matchedContentType,
      matchedSection,
      matchedKnowledgeCategory,
      matchedKnowledgeTag,
      requiredTier,
      broad = false,
    } of checks) {
      const result = await search.search(query);
      const ranked = rerankSearchResults(result.results, query, governance.records);
      const top = await Promise.all(ranked.slice(0, 10).map((item) => item.data()));
      console.log(`Search quality "${query}": ${top.map((item) => item.url).join(', ') || '(no results)'}`);
      if (!top.length) {
        failures.push(`query "${query}" returned no results`);
        continue;
      }
      const expected = top.findIndex((item) => expectedUrls.includes(item.url) || expectedPrefixes.some((prefix) => item.url.startsWith(prefix)));
      if (expected < 0) {
        failures.push(`query "${query}" did not return the expected result class (${expectedPrefixes.join(', ')}) in the top ten (got ${top.map((item) => item.url).join(', ')})`);
      }
      if (first && expected !== 0) {
        failures.push(`identifier query "${query}" should rank its entity first (rank was ${expected + 1})`);
      }
      if (Number.isInteger(maxRank) && expected >= maxRank) {
        failures.push(`query "${query}" should rank its governed entity in the top ${maxRank} (rank was ${expected + 1})`);
      }
      const matched = expected >= 0 ? top[expected] : null;
      if (matchedTier && matched?.meta?.collection_tier !== matchedTier) {
        failures.push(`query "${query}" expected matched tier ${matchedTier}, found ${matched?.meta?.collection_tier || '(missing)'}`);
      }
      if (matchedSource && matched?.meta?.source !== matchedSource) {
        failures.push(`query "${query}" expected matched source ${matchedSource}, found ${matched?.meta?.source || '(missing)'}`);
      }
      if (matchedType && matched?.meta?.primary_type !== matchedType) {
        failures.push(`query "${query}" expected matched type ${matchedType}, found ${matched?.meta?.primary_type || '(missing)'}`);
      }
      if (matchedLifecycle && matched?.meta?.lifecycle !== matchedLifecycle) {
        failures.push(`query "${query}" expected matched lifecycle ${matchedLifecycle}, found ${matched?.meta?.lifecycle || '(missing)'}`);
      }
      if (matchedContentType && matched?.meta?.content_type !== matchedContentType) {
        failures.push(`query "${query}" expected matched content type ${matchedContentType}, found ${matched?.meta?.content_type || '(missing)'}`);
      }
      if (matchedSection && matched?.meta?.collection !== matchedSection) {
        failures.push(`query "${query}" expected matched section ${matchedSection}, found ${matched?.meta?.collection || '(missing)'}`);
      }
      if (matchedKnowledgeCategory && matched?.meta?.knowledge_category !== matchedKnowledgeCategory) {
        failures.push(`query "${query}" expected knowledge category ${matchedKnowledgeCategory}, found ${matched?.meta?.knowledge_category || '(missing)'}`);
      }
      if (matchedKnowledgeTag && !(matched?.meta?.knowledge_tags || '').split(/,\s*/).includes(matchedKnowledgeTag)) {
        failures.push(`query "${query}" expected knowledge tag ${matchedKnowledgeTag}, found ${matched?.meta?.knowledge_tags || '(missing)'}`);
      }
      if (requiredTier && !top.some((item) => item.meta?.collection_tier === requiredTier)) {
        failures.push(`query "${query}" did not return required ${requiredTier} content in the top ten`);
      }
      if (broad && top[0]?.meta?.collection_tier === 'archive') {
        failures.push(`broad query "${query}" ranked archive content first`);
      }
      if (broad && !top.slice(0, 5).some((item) => item.meta?.collection_tier === 'core')) {
        failures.push(`broad query "${query}" did not surface curated core content in the top five`);
      }
    }
    const knowledgeFilterResult = await search.search('PortSwigger', {
      filters: { knowledge_category: ['training'], knowledge_access: ['free'], knowledge_tag: ['web-security'] },
    });
    const filteredKnowledgeSources = await Promise.all(knowledgeFilterResult.results.slice(0, 10).map((item) => item.data()));
    if (!filteredKnowledgeSources.some((item) => item.url === '/cyber-knowledge/knowledge-sources/#source-portswigger-web-security-academy')) {
      failures.push('knowledge-source category, access, and tag filters did not return the expected anchored record');
    }
    const sectionResult = await search.search('Detection logic T1059.003');
    const sectionPages = await Promise.all(sectionResult.results.slice(0, 5).map((item) => item.data()));
    const technique = sectionPages.find((item) => item.url.startsWith('/threat-matrix/techniques/T1059.003/'));
    const deepLink = technique?.sub_results?.find((item) => item.url.endsWith('#detection-logic'));
    if (!deepLink) failures.push('search did not emit a #detection-logic section result for T1059.003');
    await search.destroy();
  } finally {
    await new Promise((resolvePromise) => server.close(resolvePromise));
  }
}

if (!failures.length) {
  try {
    await checkQueries();
  } catch (error) {
    failures.push(`query validation crashed: ${error.stack || error.message}`);
  }
}

if (failures.length) {
  console.error('Search index check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Search index check passed (${build.indexedPages} pages, Pagefind ${build.pagefindVersion}).`);
