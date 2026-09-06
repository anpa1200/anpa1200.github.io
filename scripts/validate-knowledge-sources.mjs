import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const file = 'data/knowledge-sources.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const queue = [...data.sources];
const results = [];

async function check(source) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(source.url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'Mozilla/5.0 1200km Knowledge Sources Validator/1.0', accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8' }
    });
    const status = response.status;
    const reachable = status >= 200 && status < 400;
    source.validation = {
      ...source.validation,
      status: reachable ? 'reachable' : status === 401 || status === 403 || status === 429 ? 'access-restricted' : 'failed',
      http_status: status,
      final_url: response.url,
      checked_on: '2026-09-06'
    };
    results.push(source.validation.status);
  } catch (error) {
    source.validation = { ...source.validation, status: 'failed', error: error.name === 'AbortError' ? 'timeout' : String(error.message), checked_on: '2026-09-06' };
    results.push('failed');
  } finally {
    clearTimeout(timer);
  }

  if (source.validation.status === 'failed') {
    try {
      const curlResult = execFileSync('curl', ['-L', '-sS', '-o', '/dev/null', '-w', '%{http_code}\n%{url_effective}', '--max-time', '20', source.url], { encoding: 'utf8' }).trim().split('\n');
      const status = Number(curlResult[0]);
      if (status >= 200 && status < 400) {
        source.validation = { ...source.validation, status: 'reachable', http_status: status, final_url: curlResult.slice(1).join('\n'), fallback: 'curl' };
        results[results.length - 1] = 'reachable';
      }
    } catch {}
  }
}

async function worker() {
  while (queue.length) await check(queue.shift());
}

await Promise.all(Array.from({ length: 12 }, worker));
data.validation_summary = Object.fromEntries([...new Set(results)].sort().map(status => [status, results.filter(value => value === status).length]));
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
const byCategory = Object.entries(data.sources.reduce((acc, source) => ((acc[source.category] = (acc[source.category] || 0) + 1), acc), {})).sort((a, b) => a[0].localeCompare(b[0]));
const exceptions = data.sources.filter(source => source.validation.status !== 'reachable');
const wordCount = value => String(value || '').trim().split(/\s+/).filter(Boolean).length;
const descriptionWords = data.sources.map(source => wordCount(source.description));
const summaryWords = data.sources.map(source => wordCount(source.summary));
const report = `# Knowledge Sources Dataset Validation Report

Validated on: ${data.generated_on}

## Result

- ${data.sources.length} unique knowledge sources
- ${new Set(data.sources.map(source => source.url)).size} unique canonical URLs
- ${new Set(data.sources.map(source => source.id)).size} unique stable IDs
- ${data.sources.filter(source => source.description).length} detailed descriptions (${Math.min(...descriptionWords)}–${Math.max(...descriptionWords)} words)
- ${data.sources.filter(source => source.summary).length} compact summaries (${Math.min(...summaryWords)}–${Math.max(...summaryWords)} words)
- ${data.validation_summary.reachable || 0} reachable URLs
- ${data.validation_summary['access-restricted'] || 0} URLs protected against automated access
- ${data.validation_summary.failed || 0} failed URLs

The dataset consolidates all usable structured records from the Gemini report and the knowledge sources explicitly named in the supplied OpenAI summary. The OpenAI summary refers to separate 380 KB Markdown and 341 KB JSON artifacts, but those artifacts were not supplied; therefore, claims or records found only in those missing files are not represented.

## Quality method

The quality score combines five separately recorded dimensions: authority, originality, maintenance, practical value, and transparency. Tier A covers scores of 90–100, Tier B covers 80–89, and Tier C covers 70–79. A high score applies only within the source’s stated scope; it does not make every item published by that source correct. Automated HTTP validation confirms availability and redirects, not factual truth. Dual-use, sensitive-data, and live-malware resources carry explicit safety cautions in the JSON.

## Category coverage

${byCategory.map(([category, count]) => `- ${category}: ${count}`).join('\n')}

## Automated-access exceptions

${exceptions.length ? exceptions.map(source => `- ${source.name}: ${source.validation.http_status || 'no status'} (${source.validation.status}) — ${source.url}`).join('\n') : '- None.'}

These exceptions are retained only when the URL is canonical and the source is independently recognizable as authoritative or useful; an automated-access restriction is not treated as a dead link.
`;
fs.writeFileSync('reports/knowledge-sources-validation.md', report);
console.log(JSON.stringify(data.validation_summary));
