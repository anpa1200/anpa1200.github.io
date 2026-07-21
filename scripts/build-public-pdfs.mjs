import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(new URL('.', import.meta.url).pathname, '..');
const phonePattern = /(?:\+?972[\s().-]*(?:0[\s().-]*)?|\b0)5\d(?:[\s().-]*\d){7}\b/;
const sources = [
  ['cv.html', 'cv.pdf'],
  ['cover-letter.html', 'cover-letter.pdf'],
];
const chrome = process.env.CHROME_BIN || [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].find(existsSync);

if (!chrome) throw new Error('Chrome/Chromium was not found. Set CHROME_BIN to generate public PDFs.');

for (const [sourceName] of sources) {
  const html = readFileSync(path.join(repoRoot, sourceName), 'utf8');
  if (/href\s*=\s*["']tel:/i.test(html) || phonePattern.test(html)) {
    throw new Error(`${sourceName} contains a phone number or tel link; refusing to create a public PDF.`);
  }
}

const profileDirectory = mkdtempSync(path.join(os.tmpdir(), '1200km-pdf-'));
try {
  for (const [sourceName, outputName] of sources) {
    const sourceUrl = pathToFileURL(path.join(repoRoot, sourceName)).href;
    const outputPath = path.join(repoRoot, outputName);
    execFileSync(chrome, [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--allow-file-access-from-files',
      '--no-pdf-header-footer',
      `--user-data-dir=${profileDirectory}`,
      `--print-to-pdf=${outputPath}`,
      sourceUrl,
    ], { cwd: repoRoot, stdio: 'inherit' });

    const extracted = spawnSync('pdftotext', [outputPath, '-'], { encoding: 'utf8' });
    if (extracted.status === 0 && phonePattern.test(extracted.stdout || '')) {
      throw new Error(`${outputName} contains a phone number; refusing to keep the generated public PDF.`);
    }
    console.log(`Generated phone-free ${outputName} from ${sourceName}.`);
  }
} finally {
  rmSync(profileDirectory, { recursive: true, force: true });
}
