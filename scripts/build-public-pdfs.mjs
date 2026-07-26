import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(new URL('.', import.meta.url).pathname, '..');
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

    console.log(`Generated ${outputName} from ${sourceName}.`);
  }
} finally {
  rmSync(profileDirectory, { recursive: true, force: true });
}
