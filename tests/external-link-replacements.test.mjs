import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createExternalRewriter, unlinkPrivateUrls } from '../scripts/external-link-replacements.mjs';

const fixtures = [
  ['https://example.org/dead', 'https://web.archive.org/web/20240101000000/https://example.org/dead'],
  ['https://example.org/q?a=1&b=2', 'https://web.archive.org/web/20240101000000/https://example.org/q?a=1&b=2'],
  ['http://insecure.example.org/page', 'https://insecure.example.org/page'],
];

test('reviewed replacement data is well formed', () => {
  const data = JSON.parse(readFileSync(new URL('../data/external-link-replacements.json', import.meta.url), 'utf8'));
  assert.equal(data.schema_version, 1);
  for (const row of data.replacements) {
    assert.match(row.from, /^https?:\/\//);
    assert.match(row.to, /^https:\/\//);
    assert.ok(['archive', 'moved', 'https'].includes(row.kind), row.from);
    if (row.kind === 'archive') assert.match(row.to, /^https:\/\/web\.archive\.org\/web\/\d{8,14}\//, row.from);
    if (row.kind === 'https') assert.equal(row.to, `https://${row.from.slice('http://'.length)}`);
  }
});

test('complete-token matching, punctuation, escaped ampersands and idempotency', () => {
  const { rewriteText: rewrite, rewriteHrefs: hrefs } = createExternalRewriter(new Map(fixtures));
  {
    const markdown = [
      'See [dead](https://example.org/dead).',
      'Bare https://example.org/dead, then more.',
      'Longer https://example.org/dead.html must stay.',
      'Deeper https://example.org/dead/child must stay.',
      '<a href="https://example.org/q?a=1&amp;b=2">q</a>',
      'Upgrade http://insecure.example.org/page now.',
    ].join('\n');
    const once = rewrite(markdown).output;
    assert.match(once, /\[dead\]\(https:\/\/web\.archive\.org\/web\/20240101000000\/https:\/\/example\.org\/dead\)\./);
    assert.match(once, /Bare https:\/\/web\.archive\.org\/web\/20240101000000\/https:\/\/example\.org\/dead, then/);
    assert.match(once, /Longer https:\/\/example\.org\/dead\.html must stay/);
    assert.match(once, /Deeper https:\/\/example\.org\/dead\/child must stay/);
    assert.match(once, /href="https:\/\/web\.archive\.org\/web\/20240101000000\/https:\/\/example\.org\/q\?a=1&amp;b=2"/);
    assert.match(once, /Upgrade https:\/\/insecure\.example\.org\/page now/);
    assert.equal(rewrite(once).output, once, 'second pass must be a no-op');

    const html = '<a href="https://example.org/dead#section">https://example.org/dead</a><a href="https://example.org/dead.html">x</a>';
    const { output, replacements } = hrefs(html);
    assert.equal(replacements, 1);
    assert.match(output, /href="https:\/\/web\.archive\.org\/web\/20240101000000\/https:\/\/example\.org\/dead#section">https:\/\/example\.org\/dead<\/a>/, 'visible text is unchanged');
    assert.match(output, /href="https:\/\/example\.org\/dead\.html"/);
  }
});

test('private-host Markdown links become inline code, outside fenced code only', () => {
  const markdown = [
    'Open [http://localhost:8080](http://localhost:8080) or [the UI](http://127.0.0.1:5601/app).',
    'Metadata <http://169.254.169.254/latest/>.',
    'Public [site](https://example.org/) stays.',
    '```bash',
    'curl [x](http://localhost:9200)',
    '```',
  ].join('\n');
  const { output, replacements } = unlinkPrivateUrls(markdown);
  assert.equal(replacements, 3);
  assert.match(output, /Open `http:\/\/localhost:8080` or the UI \(`http:\/\/127\.0\.0\.1:5601\/app`\)\./);
  assert.match(output, /Metadata `http:\/\/169\.254\.169\.254\/latest\/`\./);
  assert.match(output, /\[site\]\(https:\/\/example\.org\/\)/);
  assert.match(output, /curl \[x\]\(http:\/\/localhost:9200\)/, 'fenced code is untouched');
  assert.equal(unlinkPrivateUrls(output).output, output);
});

test('archive editorial overlay entries are reviewed fixed strings', () => {
  const overlay = JSON.parse(readFileSync(new URL('../data/archive-editorial-overlay.json', import.meta.url), 'utf8'));
  assert.equal(overlay.schema_version, 1);
  for (const entry of [...overlay.phrase_replacements, ...overlay.unlink_replacements]) {
    assert.ok(entry.find && entry.replace && entry.reason && entry.find !== entry.replace, JSON.stringify(entry));
  }
  const toc = new RegExp(overlay.medium_toc_anchor_links.pattern, 'g');
  const source = '- [**Real life examples**](http://7fff)\n- [Exclude &lt;host1[,host2]&gt;: hosts](http://9cd9)\n- [Keep](https://example.org/)';
  const fixed = source.replace(toc, overlay.medium_toc_anchor_links.replace);
  assert.equal(fixed, '- **Real life examples**\n- Exclude &lt;host1[,host2]&gt;: hosts\n- [Keep](https://example.org/)');
  const empty = new RegExp(overlay.medium_empty_card_links.pattern, 'g');
  const card = '[**Repo**\n*About*github.com](https://github.com/x/y)[](https://github.com/x/y)\n![](https://cdn.example/i.png)';
  assert.equal(card.replace(empty, overlay.medium_empty_card_links.replace), '[**Repo**\n*About*github.com](https://github.com/x/y)\n![](https://cdn.example/i.png)', 'empty card links go, images stay');
});

test('archive preparation fails when a reviewed overlay entry no longer matches', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const root = mkdtempSync(join(tmpdir(), '1200km-overlay-'));
  try {
    mkdirSync(join(root, 'docs'));
    writeFileSync(join(root, 'docusaurus.config.js'), 'const config = { trailingSlash: true };\n');
    writeFileSync(join(root, 'docs', 'article.md'), '# Unrelated\n');
    const env = { ...process.env };
    delete env.ARCHIVE_OVERLAY_OPTIONAL;
    const result = spawnSync(process.execPath, [new URL('../scripts/prepare-article-archive.mjs', import.meta.url).pathname, '--archive', root], { encoding: 'utf8', env });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Archive editorial overlay no longer matches/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
