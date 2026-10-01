// Reviewed replacements for dead, moved and insecure external links.
//
// data/external-link-replacements.json is produced from link-health evidence:
//   archive: most recent Wayback capture with HTTP 200 for a dead URL
//   moved:   the publisher's own permanent-redirect target
//   https:   the https:// variant of an http:// link, verified to load
// Sources are rewritten before Docusaurus builds (archive and companions)
// and static HTML hrefs are rewritten in the staged release.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const dataPath = new URL('../data/external-link-replacements.json', import.meta.url);
const data = existsSync(dataPath) ? JSON.parse(readFileSync(dataPath, 'utf8')) : { schema_version: 1, replacements: [] };
assert.equal(data.schema_version, 1);
export const externalReplacements = new Map();
for (const { from, to, kind } of data.replacements) {
  assert.ok(/^https?:\/\//.test(from) && /^https:\/\//.test(to) && from !== to, `Invalid replacement ${from}`);
  assert.ok(['archive', 'moved', 'https'].includes(kind), `Unknown replacement kind for ${from}`);
  assert.ok(!externalReplacements.has(from), `Duplicate external replacement ${from}`);
  externalReplacements.set(from, to);
}

const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const htmlEscaped = (value) => value.replace(/&/g, '&amp;');
// A complete URL token: not preceded by URL characters, and followed by a
// delimiter or by sentence punctuation that is itself followed by a delimiter.
const before = '(?<![A-Za-z0-9_./:%~@#?=&-])';
const after = '(?=$|[\\s"\'<>)\\]`|,;]|[.,:;!?](?:[\\s"\'<>)\\]`]|$))';

export function createExternalRewriter(map) {
  const froms = [...map.keys()].sort((a, b) => b.length - a.length);
  const patterns = froms.flatMap((from) => {
    const to = map.get(from);
    const forms = [[from, to]];
    if (from.includes('&')) forms.push([htmlEscaped(from), htmlEscaped(to)]);
    return forms.map(([source, target]) => ({ from, target, pattern: new RegExp(`${before}${escape(source)}${after}`, 'g') }));
  });
  function rewriteText(input) {
    let output = input;
    const counts = {};
    for (const { from, target, pattern } of patterns) {
      const occurrences = output.match(pattern)?.length || 0;
      if (!occurrences) continue;
      output = output.replace(pattern, target);
      counts[from] = (counts[from] || 0) + occurrences;
    }
    return { output, counts, replacements: Object.values(counts).reduce((sum, count) => sum + count, 0) };
  }
  // Static HTML: only href attribute values change; visible text stays as written.
  function rewriteHrefs(html) {
    let replacements = 0;
    const output = html.replace(/(\shref=)(["'])(https?:\/\/[^"']+)\2/gi, (whole, prefix, quote, value) => {
      const decoded = value.replace(/&amp;/g, '&');
      const hash = decoded.indexOf('#');
      const base = hash >= 0 ? decoded.slice(0, hash) : decoded;
      const target = map.get(base);
      if (!target) return whole;
      replacements += 1;
      return `${prefix}${quote}${htmlEscaped(target + (hash >= 0 ? decoded.slice(hash) : ''))}${quote}`;
    });
    return { output, replacements };
  }
  return { rewriteText, rewriteHrefs };
}

const reviewed = createExternalRewriter(externalReplacements);
export const rewriteExternalText = (input) => reviewed.rewriteText(input);
export const rewriteExternalHrefs = (html) => reviewed.rewriteHrefs(html);

export async function rewriteExternalInDirectory(directory, extensions, rewrite = (text) => rewriteExternalText(text)) {
  const result = { files: 0, replacements: 0 };
  if (!existsSync(directory) || !externalReplacements.size) return result;
  async function walk(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      if (['.git', 'node_modules', 'build', '.docusaurus'].includes(entry.name)) continue;
      const child = join(path, entry.name);
      if (entry.isDirectory()) { await walk(child); continue; }
      if (!entry.isFile() || !extensions.some((extension) => entry.name.endsWith(extension))) continue;
      const text = await readFile(child, 'utf8');
      if (!text.includes('http')) continue;
      const { output, counts, replacements } = rewrite(text);
      if (output === text) continue;
      await writeFile(child, output);
      result.files += 1;
      result.replacements += replacements ?? Object.values(counts).reduce((sum, count) => sum + count, 0);
    }
  }
  await walk(directory);
  return result;
}

// Markdown links to loopback, link-local metadata or RFC 1918 hosts point at
// the reader's own machine, not a resource: render them as inline code.
const PRIVATE_URL = String.raw`https?://(?:localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|169\.254\.169\.254)(?::\d+)?(?:[/?#][^)\s>]*)?`;
// Fenced blocks (also indented inside list items, or unclosed to the end),
// CommonMark indented code blocks and single-line inline code spans are
// literal text: nothing inside them is a link, so nothing there is rewritten.
const FENCED_CODE = /^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^[ \t]*\2[ \t]*$|(?![\s\S]))/gm;
const INLINE_CODE = /(?<!`)(`+)(?!`)[^\n]*?(?<!`)\1(?!`)/g;
function mapOutside(text, pattern, transform) {
  let output = '';
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    output += transform(text.slice(last, match.index)) + match[0];
    last = match.index + match[0].length;
  }
  return output + transform(text.slice(last));
}
// Every rewrite below is single-line, so prose is transformed line by line.
// A 4-space/tab line after a blank line starts an indented code block (in MDX
// it is prose; skipping it there only leaves a link in place, never breaks code).
function mapOutsideIndentedCode(text, transform) {
  let code = false;
  let previousBlank = true;
  return text.split('\n').map((line) => {
    const blank = !line.trim();
    if (!blank) code = /^(?: {4}|\t)/.test(line) && (code || previousBlank);
    previousBlank = blank;
    return code || blank ? line : transform(line);
  }).join('\n');
}
export function unlinkPrivateUrls(markdown) {
  let replacements = 0;
  // Medium exports an autolink inside code as a whole-span `[label](url)`,
  // often followed by the swallowed punctuation as a second link:
  // `[url](url)`[.](url) -> `url`. The reader saw the label, so keep it.
  const mediumCodeLink = new RegExp(String.raw`\`\[([^\]\n]+)\]\(<?(${PRIVATE_URL})>?\)\`(?:\[([^\]\n\w]*)\]\(<?\2>?\))?`, 'g');
  const prose = (text) => text
    .replace(new RegExp(String.raw`\[([^\]\n]+)\]\((${PRIVATE_URL})\)`, 'g'), (_, text, url) => {
      replacements += 1;
      const label = text.replace(/^(\*\*|__|\*|_)?`?|`?(\*\*|__|\*|_)?$/g, '');
      return label === url ? `\`${url}\`` : `${text} (\`${url}\`)`;
    })
    .replace(new RegExp(String.raw`<(${PRIVATE_URL})>`, 'g'), (_, url) => {
      replacements += 1;
      return `\`${url}\``;
    })
    // GFM autolinks a bare URL after any non-letter; skip URLs that are part
    // of a larger URL, an HTML/JSX attribute or a Markdown link destination.
    .replace(new RegExp(String.raw`(?<![\w/:.@\-\`<]|=["']|\]\()(${PRIVATE_URL})`, 'g'), (_, match) => {
      const url = match.replace(/[.,:;!?*_~'"]+$/, '');
      replacements += 1;
      return `\`${url}\`${match.slice(url.length)}`;
    });
  const line = (text) => mapOutside(text.replace(mediumCodeLink, (_, label, url, tail = '') => {
    replacements += 1;
    return `\`${label}\`${tail}`;
  }), INLINE_CODE, prose);
  const output = mapOutside(markdown, FENCED_CODE, (text) => mapOutsideIndentedCode(text, line));
  return { output, replacements };
}
