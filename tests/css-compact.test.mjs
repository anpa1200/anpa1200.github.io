import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import { compactCss, compactInlineStyles } from '../scripts/css-compact-lib.mjs';

test('compaction keeps meaningful spaces, strings, url() and license comments', () => {
  const css = `/*! keep license */
/* drop me */
:root { --gap: 12px; }
.a :is(.b, .c) > .d::before { content: "a  ;  b"; margin: calc(100% - 2 * var(--gap)) auto; }
@media (min-width: 600px) and (max-width: 900px) { .e + .f ~ .g { background: url( "x y.png" ) , url(data:image/svg+xml;utf8,%3Csvg%3E) ; } }
.h{font-family:'Segoe UI', sans-serif !important;}
`;
  assert.equal(compactCss(css),
    '/*! keep license */:root{--gap:12px}.a :is(.b,.c)>.d::before{content:"a  ;  b";margin:calc(100% - 2 * var(--gap)) auto}'
    + '@media (min-width:600px) and (max-width:900px){.e + .f ~ .g{background:url("x y.png"),url(data:image/svg+xml;utf8,%3Csvg%3E)}}'
    + ".h{font-family:'Segoe UI',sans-serif !important}");
  assert.equal(compactCss(compactCss(css)), compactCss(css), 'idempotent');
});

test('inline styles of standalone pages are compacted; Docusaurus pages are untouched', () => {
  const page = '<html><head><style>\n  body { margin: 0; }\n</style><style type="application/json">{ "a": 1 }</style></head><body></body></html>';
  assert.equal(compactInlineStyles(page), '<html><head><style>body{margin:0}</style><style type="application/json">{ "a": 1 }</style></head><body></body></html>');
  const docusaurus = '<html><head><style> a { b: c; } </style></head><body><div id="__docusaurus"></div></body></html>';
  assert.equal(compactInlineStyles(docusaurus), docusaurus);
});

test('every shared stylesheet compacts to balanced, idempotent CSS', () => {
  for (const directory of ['assets', 'ttp-simulation/assets']) {
    for (const name of readdirSync(new URL(`../${directory}/`, import.meta.url)).filter((file) => file.endsWith('.css'))) {
      const once = compactCss(readFileSync(new URL(`../${directory}/${name}`, import.meta.url), 'utf8'));
      assert.equal(compactCss(once), once, name);
      const braces = once.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '');
      assert.equal((braces.match(/\{/g) || []).length, (braces.match(/\}/g) || []).length, `${name}: unbalanced braces`);
    }
  }
});
