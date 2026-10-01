#!/usr/bin/env node
// Mechanical migration for the audited multi-H1 documents only. Code fences,
// heading text, front matter, links and prose are preserved byte-for-byte.
import { readFileSync, writeFileSync } from 'node:fs';
export function normalizeMarkdownH1(source) {
  const lines = source.split('\n');
  let start = 0;
  if (lines[0]?.trim() === '---') {
    start = lines.findIndex((line, i) => i > 0 && line.trim() === '---') + 1;
    if (start === 0) throw Error('Unclosed front matter');
  }
  const first = lines.findIndex((line, i) => i >= start && line.trim());
  const explicitLead = /^#(?:\s|$)/.test(lines[first] || '');
  let fence = '', seen = false, changed = 0;
  for (let i = start; i < lines.length; i++) {
    const marker = lines[i].match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = '';
      continue;
    }
    if (fence || !/^#(?:\s|$)/.test(lines[i])) continue;
    if (explicitLead && !seen) { seen = true; continue; }
    lines[i] = '#' + lines[i]; changed++;
  }
  return { source: lines.join('\n'), changed };
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  for (const file of process.argv.slice(2)) {
    const original = readFileSync(file, 'utf8');
    const result = normalizeMarkdownH1(original);
    if (result.changed) writeFileSync(file, result.source);
    console.log(`${file}: demoted ${result.changed} extra H1 headings, preserving text.`);
  }
}
