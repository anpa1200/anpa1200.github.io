import { collectClones, renderCloneMetrics } from './validation-clones.mjs';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Repository/profile counters and authenticated rolling clone traffic refresh together.
// Contribution acceptance and release/source boundaries still require an audit.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clone = value => structuredClone(value);
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const integer = value => {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid counter: ${value}`);
  return value;
};
function gh(endpoint) {
  return JSON.parse(execFileSync('gh', ['api', endpoint], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
}
export function pages(endpoint, api = gh) {
  const result = [];
  for (let page = 1; ; page++) {
    const batch = api(`${endpoint}${endpoint.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    if (!Array.isArray(batch)) throw new Error(`Expected paginated array: ${endpoint}`);
    result.push(...batch);
    if (batch.length < 100) return result;
  }
}
export function collect(previous, api = gh, now = new Date()) {
  const stats = clone(previous);
  const date = now.toISOString().slice(0, 10);
  const publicRepos = pages('users/anpa1200/repos?type=owner', api).filter(repo => !repo.private);
  if (!publicRepos.length) throw new Error('Empty public repository inventory; refusing overwrite');
  const user = api('users/anpa1200');
  stats.profile = { ...stats.profile, followers: integer(user.followers), following: integer(user.following), public_repos: integer(user.public_repos), updated_at: user.updated_at, verified_at: date, status: 'verified' };
  for (const [key, name] of [['adversarygraph', 'adversarygraph'], ['aidebug', 'AIDebug']]) {
    const repo = api(`repos/anpa1200/${name}`);
    const release = api(`repos/anpa1200/${name}/releases/latest`);
    if (release.tag_name !== previous.repositories[key].release) throw new Error(`New ${name} release requires an evidence/facts audit before updating`);
    const issuesAndPrs = pages(`repos/anpa1200/${name}/issues?state=open`, api);
    stats.repositories[key] = { ...stats.repositories[key], stars: integer(repo.stargazers_count), forks: integer(repo.forks_count), watchers: integer(repo.subscribers_count), open_issues: issuesAndPrs.filter(item => !item.pull_request).length, open_pull_requests: issuesAndPrs.filter(item => item.pull_request).length, created_at: repo.created_at, updated_at: repo.updated_at, pushed_at: repo.pushed_at, verified_at: date };
  }
  stats.repositories.public_source_names = publicRepos.filter(repo => !repo.fork).map(repo => repo.full_name || `anpa1200/${repo.name}`).sort();
  stats.repositories.top_by_stars = publicRepos.sort((a,b) => b.stargazers_count - a.stargazers_count || b.forks_count - a.forks_count || a.name.localeCompare(b.name)).slice(0,5).map(repo => ({ name: repo.name, url: repo.html_url, fork: repo.fork, stars: integer(repo.stargazers_count), forks: integer(repo.forks_count) }));
  Object.assign(stats.totals, {
    github_public_repos: publicRepos.length,
    github_forked_repos: publicRepos.filter(repo => repo.fork).length,
    github_source_repos: publicRepos.filter(repo => !repo.fork).length,
    github_total_stars: publicRepos.reduce((sum, repo) => sum + integer(repo.stargazers_count), 0),
    github_total_forks: publicRepos.reduce((sum, repo) => sum + integer(repo.forks_count), 0),
    aidebug_adversarygraph_stars: stats.repositories.aidebug.stars + stats.repositories.adversarygraph.stars,
    aidebug_adversarygraph_forks: stats.repositories.aidebug.forks + stats.repositories.adversarygraph.forks,
    github_followers: stats.profile.followers,
  });
  stats.verification.github_repositories = date;
  stats.verification.github_followers = date;
  stats.verification.note = 'Repository and follower counters refreshed independently. Other evidence retains its explicit observation dates; clone coverage and gaps are recorded separately.';
  stats.generated_at = now.toISOString();
  return stats;
}
export function render(html, stats) {
  const fields = new Map();
  for (const key of ['github_public_repos','github_source_repos','github_forked_repos','github_total_stars','github_total_forks','aidebug_adversarygraph_stars']) fields.set(`totals.${key}`, stats.totals[key]);
  fields.set('profile.followers', stats.profile.followers);
  fields.set('verification.github_repositories', stats.verification.github_repositories);
  fields.set('profile.verified_at', stats.profile.verified_at);
  for (const key of ['adversarygraph','aidebug']) for (const field of ['stars','forks','watchers','open_issues','open_pull_requests','pushed_at']) fields.set(`repositories.${key}.${field}`, field === 'pushed_at' ? stats.repositories[key][field].slice(0,10) : stats.repositories[key][field]);
  for (const [key, value] of fields) {
    let count = 0;
    html = html.replace(/(<span data-validation="([^"]+)">)[^<]*(<\/span>)/g, (all, start, found, end) => { if (key !== found) return all; count++; return start + escape(value) + end; });
    const expected = key === 'verification.github_repositories' ? 3 : (key.startsWith('totals.') && key !== 'totals.aidebug_adversarygraph_stars') || /repositories\.(aidebug|adversarygraph)\.(stars|forks)$/.test(key) ? 2 : 1;
    if (count !== expected) throw new Error(`Missing validation marker or duplicate (${count}/${expected}): ${key}`);
  }
  const modified = /("dateModified":\s*")\d{4}-\d{2}-\d{2}(")/g;
  if ([...html.matchAll(modified)].length !== 1) throw new Error('Missing or duplicate page modification date');
  html = html.replace(modified, (_all,start,end)=>start+stats.generated_at.slice(0,10)+end);
  const clonePattern = /<!-- BEGIN CLONE_METRICS -->[\s\S]*?<!-- END CLONE_METRICS -->/g;
  if ([...html.matchAll(clonePattern)].length !== 1) throw new Error('Missing or duplicate clone metrics marker');
  html = html.replace(clonePattern, `<!-- BEGIN CLONE_METRICS -->\n          ${renderCloneMetrics(stats)}\n          <!-- END CLONE_METRICS -->`);
  const pattern = /(<ul class="signal-list" data-validation-top-repositories>)[\s\S]*?(<\/ul>)/g;
  if ([...html.matchAll(pattern)].length !== 1) throw new Error('Missing or duplicated top repositories marker');
  return html.replace(pattern, (_all, start, end) => start + '\n' + stats.repositories.top_by_stars.map(repo => `              <li><span><a href="${escape(repo.url)}" target="_blank" rel="noopener noreferrer">${escape(repo.name)}</a><br /><span class="muted">${repo.fork ? 'forked repository' : 'source repository'}</span></span><strong>${repo.stars} stars / ${repo.forks} forks</strong></li>`).join('\n') + '\n            ' + end);
}
// Validate/render everything before creating files. Each rename is atomic; if a
// later rename fails, restore previously replaced originals before returning.
// This is rollback on handled errors, not a cross-file crash-atomic filesystem.
export function writeTransaction(files, rename = renameSync) {
  const originals = files.map(([target]) => { try { return readFileSync(target); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } });
  const staged = files.map(([target]) => `${target}.validation-${process.pid}.tmp`);
  let installed = 0;
  try {
    files.forEach(([, content], i) => writeFileSync(staged[i], content, { flag: 'wx' }));
    for (let i = 0; i < files.length; i++) { rename(staged[i], files[i][0]); installed++; }
  } catch (error) {
    for (let i = installed - 1; i >= 0; i--) { if (originals[i] === null) rmSync(files[i][0], { force: true }); else { writeFileSync(staged[i], originals[i]); renameSync(staged[i], files[i][0]); } }
    throw error;
  } finally { staged.forEach(file => rmSync(file, { force: true })); }
}
export function update(root = ROOT, api = gh, now = new Date()) {
  const statsPath = path.join(root, 'assets/validation/stats.json');
  const pagePath = path.join(root, 'external-validation.html');
  const counters = collect(JSON.parse(readFileSync(statsPath, 'utf8')), api, now);
  const historyPath = path.join(root, 'assets/validation/clone-history.json');
  const trafficPath = path.join(root, 'assets/validation/clone-traffic.json');
  const { stats, history, traffic } = collectClones(counters, JSON.parse(readFileSync(historyPath, 'utf8')), counters.repositories.public_source_names, api, now);
  const html = render(readFileSync(pagePath, 'utf8'), stats);
  const sitemaps = ['sitemap.xml','sitemap-all.xml'].map(name => {
    const target = path.join(root,name), source = readFileSync(target,'utf8');
    const pattern = /(<loc>https:\/\/1200km\.com\/external-validation\.html<\/loc>\s*<lastmod>)[^<]+(<\/lastmod>)/g;
    if ([...source.matchAll(pattern)].length !== 1) throw new Error(`Missing or duplicate validation sitemap record: ${name}`);
    return [target,source.replace(pattern,(_all,start,end)=>start+stats.generated_at.slice(0,10)+end)];
  });
  writeTransaction([[statsPath, JSON.stringify(stats, null, 2) + '\n'], [pagePath, html], [historyPath, JSON.stringify(history, null, 2) + '\n'], [trafficPath, JSON.stringify(traffic, null, 2) + '\n'], ...sitemaps]);
  return stats;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const stats = update();
  console.log(`Refreshed repository/profile counters on ${stats.verification.github_repositories}; rolling clone traffic refreshed; historical clone observations preserved with explicit gaps.`);
}
