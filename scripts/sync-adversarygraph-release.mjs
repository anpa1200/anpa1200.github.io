#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const facts = JSON.parse(readFileSync(join(ROOT, 'data', 'site-facts.json'), 'utf8')).facts;
const sourceRelease = facts['adversarygraph.current_source_release']?.value;
const publishedTag = facts['adversarygraph.latest_release_tag']?.value;
const stale = [];

if (!/^v\d+\.\d+\.\d+$/.test(sourceRelease || '') || !/^v\d+\.\d+\.\d+$/.test(publishedTag || '')) {
  throw new Error('AdversaryGraph release facts are missing or invalid.');
}

function synchronize(content) {
  return content
    .replace(
      /(data-site-fact=["']adversarygraph\.current_source_release["'][^>]*data-fact-value=["'])v\d+\.\d+\.\d+(["'][^>]*>)v\d+\.\d+\.\d+(<\/[^>]+>)/gi,
      `$1${sourceRelease}$2${sourceRelease}$3`,
    )
    .replace(
      /(data-site-fact=["']adversarygraph\.latest_release_tag["'][^>]*data-fact-value=["'])v\d+\.\d+\.\d+(["'][^>]*>)v\d+\.\d+\.\d+(<\/[^>]+>)/gi,
      `$1${publishedTag}$2${publishedTag}$3`,
    )
    .replace(/Current source release: AdversaryGraph v\d+\.\d+\.\d+; published tag: v\d+\.\d+\.\d+\./g,
      `Current source release: AdversaryGraph ${sourceRelease}; published tag: ${publishedTag}.`)
    .replace(/Current source release: v\d+\.\d+\.\d+; published tag: v\d+\.\d+\.\d+/g,
      `Current source release: ${sourceRelease}; published tag: ${publishedTag}`)
    .replace(/v6\.5 source release/g, `${sourceRelease} release`)
    .replace(/v6\.5 source/g, `${sourceRelease} release`)
    .replace(/Current v5 platform documentation/g, `Current ${sourceRelease} platform documentation`)
    .replace(/current v5 platform surfaces/g, `current ${sourceRelease} platform surfaces`)
    .replace(/current v5 Malware Analysis workflow/g, `current ${sourceRelease} Malware Analysis workflow`)
    .replace(/available in current v5\.0/g, `available in current ${sourceRelease}`)
    .replace(/Current v5 Visual Capability Tour/g, `Current ${sourceRelease} Visual Capability Tour`)
    .replace(/Current v6 captures use/g, 'The retained v6 captures use')
    .replace(/work after the v6\.5 source boundary/g, `work after the ${sourceRelease} release boundary`)
    .replace(/The workflow remains in the v6\.5 source release\./g, `The workflow is included in the ${sourceRelease} release.`)
    .replace(/current development adds governed cross-module RAG retrieval/g,
      `the ${sourceRelease} release includes governed cross-module RAG retrieval`)
    .replace(/>Current-development guide</g, '>RAG/MCP guide<')
    .replace(/<span class="status dev">Publication pending<\/span>/g,
      `<span class="status stable">Published tag ${publishedTag}</span>`)
    .replace(/Current source release: <strong>AdversaryGraph v\d+\.\d+\.\d+<\/strong>; latest published tag: <strong>v\d+\.\d+\.\d+<\/strong>\./g,
      `Current source release: <strong>AdversaryGraph ${sourceRelease}</strong>; latest published tag: <strong>${publishedTag}</strong>.`)
    .replace(
      /(children:\["Current source release: ",[\s\S]{0,120}?children:")AdversaryGraph v\d+\.\d+\.\d+("\}\),"; latest published tag: ",[\s\S]{0,120}?children:")v\d+\.\d+\.\d+/g,
      `$1AdversaryGraph ${sourceRelease}$2${publishedTag}`,
    )
    .replace(/AdversaryGraph v\d+\.\d+\.\d+ source/g, `AdversaryGraph ${sourceRelease} release`)
    .replace(/v\d+\.\d+\.\d+ source/g, `${sourceRelease} release`)
    .replace(
      /AdversaryGraph v\d+\.\d+\.\d+ is the current merged, CI-validated source release(?:, with a reproducible readiness gate, rollback guidance, current evidence, and documented case studies|\. It packages the production-readiness gate, rollback guidance, screenshot evidence, and case studies)\. v\d+\.\d+\.\d+ remains the latest published immutable GitHub release(?: until (?:the )?protected(?: tag workflow publishes v\d+\.\d+\.\d+| v\d+\.\d+\.\d+ tag workflow completes))?\./g,
      `AdversaryGraph ${sourceRelease} is the current merged, CI-validated source release and matches ${publishedTag}, the latest published immutable GitHub release.`,
    )
    .replace(/(latest published immutable GitHub release)\.\d+\.\d+ tag workflow completes\./g, '$1.')
    .replace(
      /Screenshots are version-specific evidence\. v4 and v5 captures are retained as (?:clearly )?historical workflow evidence; the current source release is v\d+\.\d+\.\d+ and the latest published immutable GitHub release is v\d+\.\d+\.\d+\./g,
      `Screenshots are version-specific evidence. v4 and v5 captures are retained as historical workflow evidence; the current source and latest published release are ${sourceRelease}.`,
    )
    .replace(
      /Release boundary: <strong>v\d+\.\d+\.\d+<\/strong> is merged and CI-validated on <code>main<\/code>, and the 31 workspaces below describe that source release\. <strong>v\d+\.\d+\.\d+<\/strong> remains the latest published immutable GitHub release until the protected tag workflow publishes v\d+\.\d+\.\d+\./g,
      `Release boundary: <strong>${sourceRelease}</strong> is merged and CI-validated on <code>main</code>, and the 31 workspaces below describe that release. It matches <strong>${publishedTag}</strong>, the latest published immutable GitHub release.`,
    )
    .replace(
      /<span data-site-fact="adversarygraph\.current_source_release" data-fact-value="v\d+\.\d+\.\d+">v\d+\.\d+\.\d+<\/span> is the current merged, CI-validated source release described by this guide\. <span data-site-fact="adversarygraph\.latest_release_tag" data-fact-value="v\d+\.\d+\.\d+">v\d+\.\d+\.\d+<\/span> remains the latest published immutable GitHub release until the protected v\d+\.\d+\.\d+ tag workflow completes\./g,
      `<span data-site-fact="adversarygraph.current_source_release" data-fact-value="${sourceRelease}">${sourceRelease}</span> is the current merged, CI-validated release described by this guide and matches <span data-site-fact="adversarygraph.latest_release_tag" data-fact-value="${publishedTag}">${publishedTag}</span>, the latest published immutable GitHub release.`,
    );
}

const targets = [
  'adversarygraph/index.html',
  'adversarygraph/full-version-feature-guides.html',
  'adversarygraph-docs/index.html',
  'adversarygraph-docs/intro/index.html',
  'adversarygraph-docs/roadmap/index.html',
  'adversarygraph-docs/capabilities/index.html',
  'adversarygraph-docs/malware-analysis/index.html',
  'adversarygraph-docs/platform-guide/index.html',
];
const chunkRoot = join(ROOT, 'adversarygraph-docs', 'assets', 'js');
if (existsSync(chunkRoot)) {
  targets.push(...readdirSync(chunkRoot)
    .filter((name) => name.endsWith('.js'))
    .map((name) => join('adversarygraph-docs', 'assets', 'js', name)));
}

for (const relativePath of targets) {
  const path = join(ROOT, relativePath);
  if (!existsSync(path)) throw new Error(`${relativePath}: release synchronization target is missing.`);
  const current = readFileSync(path, 'utf8');
  const generated = synchronize(current);
  if (generated === current) continue;
  if (check) stale.push(relativePath);
  else writeFileSync(path, generated);
}

if (stale.length) {
  throw new Error(`AdversaryGraph release surfaces are stale:\n- ${stale.join('\n- ')}`);
}

console.log(`${check ? 'Validated' : 'Synchronized'} AdversaryGraph ${sourceRelease} release surfaces (${publishedTag} published tag).`);
