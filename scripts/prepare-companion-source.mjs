import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

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
}
