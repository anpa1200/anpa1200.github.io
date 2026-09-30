import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ctiSourceRewrites, rewriteCrosslinksInDirectory } from './canonical-crosslinks.mjs';
import { rewriteExternalInDirectory, unlinkPrivateUrls } from './external-link-replacements.mjs';

export function migrationBodyHeadings() {
  return (tree, file) => {
    // Docusaurus retains a recognized content title inside an MDX <header>.
    // If it did not recognize one, DocItem supplies its own synthetic H1.
    let preserveTitle = typeof file.data.contentTitle === 'string';
    const outline = [{ original: 1, depth: 1 }];
    const visit = (node) => {
      if (node.type === 'heading' && node.depth === 1) {
        if (preserveTitle) preserveTitle = false;
        else node.depth = 2;
      }
      if (node.type === 'heading') {
        const original = node.depth;
        while (outline.length && outline.at(-1).original >= original) outline.pop();
        node.depth = Math.min(original, (outline.at(-1)?.depth || 0) + 1);
        outline.push({ original, depth: node.depth });
      }
      for (const child of node.children || []) visit(child);
    };
    visit(tree);
  };
}

export async function prepareCompanionSource(source, mount, configPath) {
  let config = await readFile(configPath, 'utf8');
  config = config.replace(/\n\/\/ 1200km migration:[\s\S]*?(?=\n(?:export default config;|module\.exports\s*=\s*config;))/, '\n');
  // Preserve Docusaurus's content-title H1 or synthetic DocItem title. Only
  // extra body H1s become H2s, keeping IDs and the precomputed TOC intact.
  const overlay = `
// 1200km migration: apply the same heading hierarchy in SSR and client output.
${migrationBodyHeadings.toString()}
for (const preset of config.presets || []) {
  if (!Array.isArray(preset) || !preset[1] || preset[1].docs === false) continue;
  preset[1].docs ||= {};
  preset[1].docs.remarkPlugins = [...(preset[1].docs.remarkPlugins || []), migrationBodyHeadings];
}
`;
  if (!config.includes('function migrationBodyHeadings')) {
    const marker = /(?:export default config;|module\.exports\s*=\s*config;)/;
    assert.ok(marker.test(config), `Unsupported companion config export: ${mount}`);
    config = config.replace(marker, (match) => overlay + '\n' + match);
    await writeFile(configPath, config);
  }
  if (mount === 'cti-analyst-field-manual') {
    const file = join(source, 'src/css/custom.css');
    const css = await readFile(file, 'utf8');
    // Use the authored system-font fallback, matching the main site's local
    // font policy. No new font/style origin is added to the existing CSP.
    await writeFile(file, css.replace(/@import url\(['"]https:\/\/fonts\.googleapis\.com\/[^'"\n]+['"]\);/g, ''));
  }
  if (mount === 'adversarygraph-docs') {
    const file = join(source, 'src/css/custom.css');
    const css = await readFile(file, 'utf8');
    // The upstream optimizer sorts media rules after base rules. Explicit
    // priority keeps prose natural at every width; child URLs/code retain
    // their own wrapping declarations instead of inheriting this value.
    const rule = '/* 1200km migration: preserve natural prose wrapping. */\n.theme-doc-markdown p, .theme-doc-markdown li { overflow-wrap: normal !important; word-break: normal !important; }';
    const marker = /\/\* 1200km migration: preserve natural prose wrapping\. \*\/\n\.theme-doc-markdown p, \.theme-doc-markdown li \{[^}]+\}/;
    await writeFile(file, marker.test(css) ? css.replace(marker, rule) : `${css}\n${rule}\n`);
  }
  if (mount === 'insider-threat-detection') {
    const file = join(source, 'src/pages/index.js');
    await writeFile(file, (await readFile(file, 'utf8')).replace(/<h3>/g, '<h2>').replace(/<\/h3>/g, '</h2>'));
  }
  // Page components lacking a main landmark get one in source, avoiding a
  // post-build change to React's hydration tree.
  const pageNames = mount === 'CTI_as_a_Code'
    ? ['intake-form.jsx', 'intake-fullcycle.jsx', 'intake-proactive.jsx']
    : ['ai-vs-defense', 'Hexstrike-AI-guide'].includes(mount) ? ['index.js'] : [];
  for (const name of pageNames) {
    const file = join(source, 'src/pages', name);
    assert.ok(existsSync(file), `${mount}: missing ${name}`);
    let jsx = await readFile(file, 'utf8');
    if (!/<main\b/.test(jsx)) {
      jsx = jsx.replace(/(<Layout\b[^>]*>)/, '$1<main>').replace('</Layout>', '</main></Layout>');
      assert.ok(/<main>/.test(jsx));
      await writeFile(file, jsx);
    }
  }
  if (mount === 'CTI_as_a_Code') {
    const file = join(source, 'src/pages/intake-form.module.css');
    await writeFile(file, `${await readFile(file, 'utf8')}\n/* Keep the existing intake controls usable on narrow screens. */\n@media (max-width: 600px) {\n  .headerGrid { grid-template-columns: minmax(0, 1fr); }\n  .toolbar, .toolbarActions, .logRow { flex-wrap: wrap; }\n  .logSrc { min-width: 0; overflow-wrap: anywhere; }\n  .regTable, .actionsTable { display: block; max-width: 100%; overflow-x: auto; }\n  input, select, textarea { max-width: 100%; box-sizing: border-box; }\n}\n`);
  }
  let rewritten = 0;
  if (mount === 'CTI_as_a_Code') {
    for (const directory of ['docs', 'src']) {
      const result = await rewriteCrosslinksInDirectory(join(source, directory), ['.md', '.mdx', '.js', '.jsx', '.ts', '.tsx'], ctiSourceRewrites);
      rewritten += result.replacements;
    }
  }
  for (const directory of ['docs', 'src', 'static']) {
    const result = await rewriteCrosslinksInDirectory(join(source, directory), ['.md', '.mdx', '.js', '.jsx', '.ts', '.tsx', '.html']);
    rewritten += result.replacements;
    // Reviewed dead/moved/insecure external links and private-host links.
    rewritten += (await rewriteExternalInDirectory(join(source, directory), ['.md', '.mdx', '.js', '.jsx', '.ts', '.tsx', '.html'])).replacements;
    rewritten += (await rewriteExternalInDirectory(join(source, directory), ['.md', '.mdx'], unlinkPrivateUrls)).replacements;
  }
  if (mount === 'CTI_as_a_Code') {
    const labels = [
      ['docs/ecosystem.md', 'Field Manual — Actor Research', 'Field Manual — Actor Profile Template'],
      ['docs/methodology.md', 'Field Manual — Analysis of Competing Hypotheses', 'Field Manual — Alternative Hypotheses'],
      ['docs/methodology.md', 'Field Manual — Intelligence Production', 'Field Manual — Finished Intelligence vs. Research Notes'],
      ['docs/training/07-full-cycle-ndsa.md', 'Field Manual — Collection Planning', 'Field Manual — Collection Gap Register'],
    ];
    for (const [relative, before, after] of labels) {
      const file = join(source, relative);
      const text = await readFile(file, 'utf8');
      assert.ok(text.includes(before), `${mount}: expected crosslink label is missing in ${relative}`);
      await writeFile(file, text.replaceAll(before, after));
    }
  }
  if (rewritten) console.log(`Normalized ${rewritten} pinned crosslink(s) in ${mount} source before Docusaurus hydration build.`);
}
