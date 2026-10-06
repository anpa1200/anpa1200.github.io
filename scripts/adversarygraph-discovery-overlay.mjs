import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Apply before Docusaurus compiles both server and client trees.
export function prepareAdversaryGraphDiscovery(source, facts) {
  const version = facts['adversarygraph.development_version'].value;
  const commit = facts['adversarygraph.development_commit'].value;
  const stable = facts['adversarygraph.latest_release_tag'].value;
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (/\.(md|mdx|js|jsx)$/.test(entry.name)) {
        const before = readFileSync(path, 'utf8');
        const after = before.replace(/\bimmutable\s+(GitHub\s+(?:release|tag)|(?:v7\.0\.0\s+)?(?:release|tag))\b/gi, '$1')
          .replace(/latest published immutable\s+GitHub release/gi, 'latest published stable GitHub release')
          .replace(/latest published immutable\s+release/gi, 'latest published stable release')
          .replace(/Current source release/g, 'Documented source release')
          .replace(/current source release/g, 'documented source release');
        if (after !== before) writeFileSync(path, after);
      }
    }
  }
  visit(join(source, 'docs')); visit(join(source, 'src'));
  const path = join(source, 'src/pages/index.js');
  let page = readFileSync(path, 'utf8');
  page = page.replace(/src: '(img\/[^']+\.png)',/g, (match, src) => {
    if (page.includes(`${match}\n    width:`)) return match;
    const bytes = readFileSync(join(source, 'static', src));
    if (bytes.readUInt32BE(0) !== 0x89504e47 || bytes.toString('ascii', 12, 16) !== 'IHDR') throw Error(`Invalid PNG: ${src}`);
    return `${match}\n    width: ${bytes.readUInt32BE(16)}, height: ${bytes.readUInt32BE(20)},`;
  });
  page = page.replace('proofScreens.map(({title, body, src, href, alt})', 'proofScreens.map(({title, body, src, href, alt, width, height})')
    .replace('<img src={`${baseUrl}${src}`} alt={alt} loading="lazy" />', '<img src={`${baseUrl}${src}`} alt={alt} loading="lazy" width={width} height={height} />');
  if (!page.includes('data-release-boundary="verified"')) {
    const note = `<p data-release-boundary="verified">Documented stable release: ${stable}. Current development: ${version}, verified ${facts['adversarygraph.development_version'].verified_at} at <a href="https://github.com/anpa1200/adversarygraph/blob/${commit}/VERSION">source commit ${commit.slice(0, 7)}</a>. These guides describe the stable release; beta capabilities require separate validation.</p>`;
    page = page.replace('</h1>', `</h1>${note}`);
  }
  writeFileSync(path, page);
}
