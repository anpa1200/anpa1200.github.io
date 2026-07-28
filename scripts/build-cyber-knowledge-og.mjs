#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const model = JSON.parse(readFileSync(join(ROOT, 'data', 'cyber-knowledge.json'), 'utf8'));
const output = join(ROOT, 'assets', 'cyber-knowledge-og');
mkdirSync(output, { recursive: true });

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function wrap(value, limit = 29) {
  const words = value.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (line && `${line} ${word}`.length > limit) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function svgFor({ label, name, modules }) {
  const lines = wrap(name);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#071225"/>
      <stop offset="1" stop-color="#0d1c37"/>
    </linearGradient>
    <radialGradient id="glow" cx="82%" cy="28%" r="60%">
      <stop offset="0" stop-color="#0f62fe" stop-opacity=".35"/>
      <stop offset="1" stop-color="#0f62fe" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <path d="M0 86H1200M0 544H1200" stroke="#24446f"/>
  <circle cx="1050" cy="150" r="112" fill="none" stroke="#2e5f9f" stroke-width="2"/>
  <circle cx="1050" cy="150" r="70" fill="none" stroke="#2e5f9f" stroke-width="2"/>
  <circle cx="1050" cy="150" r="8" fill="#62a0ff"/>
  <text x="72" y="72" fill="#92b8ef" font-family="Inter,Arial,sans-serif" font-size="24" font-weight="700" letter-spacing="3">1200KM · CYBER KNOWLEDGE</text>
  <text x="72" y="142" fill="#68a3ff" font-family="Inter,Arial,sans-serif" font-size="25" font-weight="800" letter-spacing="2">${escapeXml(label)}</text>
  ${lines.map((line, index) => `<text x="72" y="${228 + index * 78}" fill="#f1f6ff" font-family="Inter,Arial,sans-serif" font-size="66" font-weight="800">${escapeXml(line)}</text>`).join('\n  ')}
  <text x="72" y="520" fill="#a9bddc" font-family="Inter,Arial,sans-serif" font-size="25">${escapeXml(modules)} · reviewed ${escapeXml(model.collection.reviewed_at)}</text>
  <text x="1128" y="590" text-anchor="end" fill="#7f9abe" font-family="Inter,Arial,sans-serif" font-size="22">1200km.com</text>
</svg>`;
}

const cards = [
  { id: 'hub', label: '11 PRACTITIONER DOMAINS', name: 'Cyber Knowledge', modules: 'Connected field-guide collection' },
  ...model.domains.map((domain) => ({
    id: domain.id,
    label: `DOMAIN ${String(domain.position).padStart(2, '0')}`,
    name: domain.name,
    modules: `${new Set(
      [...readFileSync(join(ROOT, domain.path), 'utf8').matchAll(/\bid=["'](?:m|module-)(\d+)["']/gi)]
        .map((match) => Number(match[1])),
    ).size} modules`,
  })),
];

for (const card of cards) {
  const svgPath = join(output, `${card.id}.svg`);
  const pngPath = join(output, `${card.id}.png`);
  writeFileSync(svgPath, svgFor(card));
  execFileSync('google-chrome', [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-sandbox',
    '--window-size=1200,630',
    `--screenshot=${pngPath}`,
    `file://${svgPath}`,
  ], { stdio: 'ignore' });
}

console.log(`Generated ${cards.length} Cyber Knowledge OG cards in ${output}.`);
