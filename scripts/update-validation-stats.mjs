import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(new URL('.', import.meta.url).pathname, '..');
const pagePath = path.join(repoRoot, 'external-validation.html');
const statsPath = path.join(repoRoot, 'assets', 'validation', 'stats.json');
const cloneHistoryPath = path.join(repoRoot, 'assets', 'validation', 'clone-history.json');

function runJson(command, args, fallback = null) {
  try {
    const output = execFileSync(command, args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, DEBUG: '' },
    });
    return JSON.parse(output);
  } catch (error) {
    if (fallback !== null) return fallback;
    throw error;
  }
}

function ghSearch(args) {
  return runJson('gh', ['search', 'prs', ...args, '--json', 'repository,number,title,url,state,createdAt,updatedAt,closedAt']);
}

function ghRepo(nameWithOwner) {
  return runJson('gh', ['api', `repos/${nameWithOwner}`]);
}

function ghUser(username) {
  return runJson('gh', ['api', `users/${username}`]);
}

function ghPrDetails(pr, includeReviewHealth = false) {
  const nameWithOwner = pr.repository.nameWithOwner;
  const details = runJson('gh', ['api', `repos/${nameWithOwner}/pulls/${pr.number}`]);
  const comments = includeReviewHealth ? runJson('gh', ['api', `repos/${nameWithOwner}/issues/${pr.number}/comments?per_page=100`], []) : [];
  const reviews = includeReviewHealth ? runJson('gh', ['api', `repos/${nameWithOwner}/pulls/${pr.number}/reviews?per_page=100`], []) : [];
  return {
    ...pr,
    canonical_state: details.state,
    merged_at: details.merged_at,
    closed_at: details.closed_at,
    draft: details.draft,
    mergeable_state: details.mergeable_state || 'unknown',
    comments_count: Array.isArray(comments) ? comments.length : 0,
    reviews_count: Array.isArray(reviews) ? reviews.length : 0,
  };
}

function ghUserRepos(username) {
  const repos = [];
  for (let page = 1; ; page += 1) {
    const batch = runJson('gh', ['api', `users/${username}/repos?per_page=100&page=${page}`], []);
    if (!batch.length) break;
    repos.push(...batch);
  }
  return repos;
}

function ghLatestRelease(nameWithOwner, fallbackTag) {
  const release = runJson('gh', ['api', `repos/${nameWithOwner}/releases/latest`], null);
  return release ? { tag: release.tag_name, url: release.html_url, published_at: release.published_at } : { tag: fallbackTag, url: '', published_at: null };
}

function gitlabMr(projectPath, iid) {
  const encodedProject = encodeURIComponent(projectPath);
  return runJson(
    'curl',
    ['-fsSL', `https://gitlab.com/api/v4/projects/${encodedProject}/merge_requests/${iid}`],
    null,
  );
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function replaceOrThrow(html, pattern, replacement, label) {
  pattern.lastIndex = 0;
  if (!pattern.test(html)) throw new Error(`Could not update ${label}`);
  pattern.lastIndex = 0;
  return html.replace(pattern, replacement);
}

function formatDate(value) {
  if (!value) return 'unknown';
  return new Date(value).toISOString().slice(0, 10);
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function formatDateRange(fromIso, toIso) {
  const from = new Date(`${fromIso}T00:00:00Z`);
  const to = new Date(`${toIso}T00:00:00Z`);
  const fromLabel = `${MONTH_ABBR[from.getUTCMonth()]} ${from.getUTCDate()}`;
  const toLabel = `${MONTH_ABBR[to.getUTCMonth()]} ${to.getUTCDate()}`;
  return `${fromLabel}–${toLabel} ${to.getUTCFullYear()}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function plural(value, singular, pluralValue = `${singular}s`) {
  return `${value} ${value === 1 ? singular : pluralValue}`;
}

function renderReviewBacklog() {
  const review = stats.github.open_review;
  const stateRows = [
    ['Clean / mergeable', review.clean, 'No technical blocker detected by GitHub.'],
    ['Unstable', review.unstable, 'Usually branch protection, missing status context, or pending required checks.'],
    ['Behind', review.behind, 'Source branch needs sync with the target branch.'],
    ['Blocked', review.blocked, 'Repository rules block merge until a required condition is satisfied.'],
    ['Unknown', review.unknown, 'GitHub did not expose a stable mergeability result at snapshot time.'],
  ].map(([label, value, hint]) => `              <li><span>${escapeHtml(label)}<br /><span class="muted">${escapeHtml(hint)}</span></span><strong>${value}</strong></li>`)
    .join('\n');

  return `          <article class="card">
            <h3>Open PR Backlog Health</h3>
            <p>${review.no_comments_no_reviews} of ${stats.github.open_prs} open GitHub PRs have no maintainer comments or reviews yet. ${review.drafts} are draft PRs.</p>
            <ul class="signal-list">
${stateRows}
            </ul>
            <p class="note">Main reason for the backlog: external maintainer review latency. Actionable technical items at this snapshot: ${review.behind} behind, ${review.blocked} blocked, ${review.unstable} unstable.</p>
          </article>`;
}

function repoStatsCard(repoKey, title, description) {
  const repo = stats.repositories[repoKey];
  return `          <article class="card">
            <h3><a href="${escapeHtml(repo.url)}" target="_blank" rel="noopener">${escapeHtml(title)}</a></h3>
            <p>${escapeHtml(description)}</p>
            <ul class="signal-list">
              <li><span>Stars / forks</span><strong>${repo.stars} / ${repo.forks}</strong></li>
              <li><span>Watchers</span><strong>${repo.watchers}</strong></li>
              <li><span>Open issues</span><strong>${repo.open_issues}</strong></li>
              <li><span>Latest release</span><strong><a href="${escapeHtml(repo.release_url || repo.url)}" target="_blank" rel="noopener">${escapeHtml(repo.release)}</a></strong></li>
              <li><span>Last pushed</span><strong>${formatDate(repo.pushed_at)}</strong></li>
            </ul>
          </article>`;
}

function renderValidationSignal() {
  const topRepos = stats.repositories.top_by_stars
    .map(repo => `              <li><span><a href="${escapeHtml(repo.url)}" target="_blank" rel="noopener">${escapeHtml(repo.name)}</a><br /><span class="muted">${repo.fork ? 'forked repository' : 'source repository'}</span></span><strong>${repo.stars} stars / ${repo.forks} ${repo.forks === 1 ? 'fork' : 'forks'}</strong></li>`)
    .join('\n');
  const gitlabLinks = stats.gitlab.open_items.length
    ? `\n            <div class="links">\n${stats.gitlab.open_items.map(item => `              <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a>`).join('\n')}\n            </div>`
    : '';

  return `<div class="grid">
          <article class="card">
            <h3>GitHub PR Review Signal</h3>
            <p>Accepted and pending upstream pull requests are tracked separately so open submissions are not presented as accepted validation.</p>
            <ul class="signal-list">
              <li><span>Merged external PRs</span><strong>${stats.github.merged_prs}</strong></li>
              <li><span>Open GitHub PRs</span><strong>${stats.github.open_prs}</strong></li>
              <li><span>Closed unmerged GitHub PRs</span><strong>${stats.github.closed_unmerged_prs}</strong></li>
            </ul>
            <div class="links">
              <a href="https://github.com/pulls?q=is%3Apr+author%3Aanpa1200+is%3Aopen" target="_blank" rel="noopener">Open PR search</a>
              <a href="https://github.com/pulls?q=is%3Apr+author%3Aanpa1200+is%3Amerged" target="_blank" rel="noopener">Merged PR search</a>
            </div>
          </article>
          <article class="card">
            <h3>GitLab MR Review Signal</h3>
            <p>GitLab merge requests are included from authenticated GitLab data plus public MR verification for known upstream requests.</p>
            <ul class="signal-list">
              <li><span>Open GitLab MRs</span><strong>${stats.gitlab.open_mrs}</strong></li>
              <li><span>Merged GitLab MRs</span><strong>${stats.gitlab.merged_mrs}</strong></li>
              <li><span>Closed GitLab MRs</span><strong>${stats.gitlab.closed_mrs}</strong></li>
            </ul>
${gitlabLinks}
          </article>
          <article class="card">
            <h3>Portfolio Repository Signal</h3>
            <p>Public GitHub footprint at snapshot time, including source repositories and forked repositories.</p>
            <ul class="signal-list">
              <li><span>Public repositories</span><strong>${stats.totals.github_public_repos}</strong></li>
              <li><span>Source repositories</span><strong>${stats.totals.github_source_repos}</strong></li>
              <li><span>Forked repositories</span><strong>${stats.totals.github_forked_repos}</strong></li>
              <li><span>Total stars across public repositories</span><strong>${stats.totals.github_total_stars}</strong></li>
              <li><span>Total forks across public repositories</span><strong>${stats.totals.github_total_forks}</strong></li>
            </ul>
          </article>
${repoStatsCard('adversarygraph', 'AdversaryGraph', 'Repository traction and release evidence for the self-hosted CTI platform.')}
${repoStatsCard('aidebug', 'AIDebug', 'Repository traction and release evidence for the malware-analysis and reverse-engineering debugger.')}
${renderReviewBacklog()}
          <article class="card">
            <h3>Top Starred Public Repositories</h3>
            <p>Highest-star public repositories visible under the GitHub account at snapshot time.</p>
            <ul class="signal-list">
${topRepos}
            </ul>
          </article>
        </div>`;
}

const github = {
  open_search: ghSearch(['--author', 'anpa1200', '--state', 'open', '--limit', '100']).map(pr => ghPrDetails(pr, true)),
  merged_search: ghSearch(['--author', 'anpa1200', '--state', 'closed', '--merged', '--limit', '100']).map(pr => ghPrDetails(pr)),
  closed_search: ghSearch(['--author', 'anpa1200', '--state', 'closed', '--limit', '100']).map(pr => ghPrDetails(pr)),
};
github.open = github.open_search.filter(pr => pr.canonical_state === 'open' && !pr.merged_at);
github.merged = github.merged_search.filter(pr => pr.merged_at);
github.closed_unmerged = github.closed_search.filter(pr => pr.canonical_state === 'closed' && !pr.merged_at);

const gitlabMrs = runJson(
  'glab',
  ['api', 'merge_requests?scope=all&author_username=1200km&per_page=100&order_by=updated_at&sort=desc'],
  [],
);
const publicGitlabMrs = [
  gitlabMr('kalilinux/documentation/kali-tools', 30),
].filter(Boolean);
const allGitlabMrs = uniqueBy([...gitlabMrs, ...publicGitlabMrs], mr => mr.web_url || `${mr.project_id}:${mr.iid}`);

const repos = {
  adversarygraph: ghRepo('anpa1200/adversarygraph'),
  aidebug: ghRepo('anpa1200/AIDebug'),
};
const user = ghUser('anpa1200');
const publicRepos = ghUserRepos('anpa1200');
const topPublicRepos = [...publicRepos]
  .sort((left, right) => right.stargazers_count - left.stargazers_count || right.forks_count - left.forks_count || left.name.localeCompare(right.name))
  .slice(0, 5)
  .map(repo => ({
    name: repo.name,
    url: repo.html_url,
    fork: repo.fork,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
  }));

const releases = {
  adversarygraph: ghLatestRelease('anpa1200/adversarygraph', 'v3.1.0'),
  aidebug: ghLatestRelease('anpa1200/AIDebug', 'v1.1.0'),
};

function ghCloneTraffic(nameWithOwner) {
  return runJson('gh', ['api', `repos/${nameWithOwner}/traffic/clones`], null);
}

const sourceRepoNames = publicRepos.filter(repo => !repo.fork).map(repo => repo.full_name);
const cloneTrafficByRepo = {};
for (const nameWithOwner of sourceRepoNames) {
  const traffic = ghCloneTraffic(nameWithOwner);
  if (traffic) cloneTrafficByRepo[nameWithOwner] = traffic;
}

const activeCloneRepos = Object.entries(cloneTrafficByRepo).filter(([, traffic]) => traffic.count > 0);
const last14Days = {
  repos: activeCloneRepos.length,
  clones: activeCloneRepos.reduce((total, [, traffic]) => total + traffic.count, 0),
  uniques: activeCloneRepos.reduce((total, [, traffic]) => total + traffic.uniques, 0),
};

const todayUtc = todayIsoDate();
const dailyTotals = new Map();
for (const traffic of Object.values(cloneTrafficByRepo)) {
  for (const entry of traffic.clones ?? []) {
    const date = entry.timestamp.slice(0, 10);
    if (date === todayUtc) continue; // today's window is still accumulating; exclude until finalized
    const existing = dailyTotals.get(date) ?? { clones: 0, uniques: 0 };
    existing.clones += entry.count;
    existing.uniques += entry.uniques;
    dailyTotals.set(date, existing);
  }
}

let cloneHistory = { tracking_started: todayUtc, baseline: null, days: {} };
try {
  cloneHistory = JSON.parse(readFileSync(cloneHistoryPath, 'utf8'));
} catch {
  // no history yet; this run establishes the log going forward
}
// Days already folded into the manually-reconciled baseline must not be re-added,
// or they would be double-counted in the cumulative total.
const baselineThrough = cloneHistory.baseline?.through ?? null;
for (const [date, totals] of dailyTotals) {
  if (baselineThrough && date <= baselineThrough) continue;
  cloneHistory.days[date] = totals; // finalized days only; overwrite with freshest pull
}
mkdirSync(path.dirname(cloneHistoryPath), { recursive: true });
writeFileSync(cloneHistoryPath, `${JSON.stringify(cloneHistory, null, 2)}\n`);

const historyDates = Object.keys(cloneHistory.days).sort();
const cumulativeClones = {
  since: cloneHistory.baseline ? cloneHistory.tracking_started : (historyDates[0] ?? todayUtc),
  through: historyDates[historyDates.length - 1] ?? baselineThrough ?? todayUtc,
  clones: (cloneHistory.baseline?.clones ?? 0) + Object.values(cloneHistory.days).reduce((total, d) => total + d.clones, 0),
  uniques: (cloneHistory.baseline?.uniques ?? 0) + Object.values(cloneHistory.days).reduce((total, d) => total + d.uniques, 0),
};
const thisRunDates = [...dailyTotals.keys()].sort();
last14Days.since = thisRunDates[0] ?? todayUtc;
last14Days.through = thisRunDates[thisRunDates.length - 1] ?? todayUtc;

const stats = {
  generated_at: new Date().toISOString(),
  github: {
    open_prs: github.open.length,
    merged_prs: github.merged.length,
    closed_unmerged_prs: github.closed_unmerged.length,
    open_review: {
      clean: github.open.filter(pr => pr.mergeable_state === 'clean').length,
      unstable: github.open.filter(pr => pr.mergeable_state === 'unstable').length,
      behind: github.open.filter(pr => pr.mergeable_state === 'behind').length,
      blocked: github.open.filter(pr => pr.mergeable_state === 'blocked').length,
      unknown: github.open.filter(pr => !['clean', 'unstable', 'behind', 'blocked'].includes(pr.mergeable_state)).length,
      drafts: github.open.filter(pr => pr.draft).length,
      no_comments_no_reviews: github.open.filter(pr => pr.comments_count === 0 && pr.reviews_count === 0).length,
      with_comments_or_reviews: github.open.filter(pr => pr.comments_count > 0 || pr.reviews_count > 0).length,
    },
  },
  gitlab: {
    open_mrs: allGitlabMrs.filter(mr => mr.state === 'opened').length,
    merged_mrs: allGitlabMrs.filter(mr => mr.state === 'merged').length,
    closed_mrs: allGitlabMrs.filter(mr => mr.state === 'closed').length,
    open_items: allGitlabMrs
      .filter(mr => mr.state === 'opened')
      .map(mr => ({
        title: mr.title,
        url: mr.web_url,
        updated_at: mr.updated_at,
        merge_status: mr.detailed_merge_status || mr.merge_status || 'unknown',
        draft: Boolean(mr.draft || mr.work_in_progress),
        has_conflicts: Boolean(mr.has_conflicts),
      })),
  },
  profile: {
    url: user.html_url,
    followers: user.followers,
    following: user.following,
    public_repos: user.public_repos,
    updated_at: user.updated_at,
  },
  repositories: {
    adversarygraph: {
      url: repos.adversarygraph.html_url,
      stars: repos.adversarygraph.stargazers_count,
      forks: repos.adversarygraph.forks_count,
      watchers: repos.adversarygraph.watchers_count,
      open_issues: repos.adversarygraph.open_issues_count,
      created_at: repos.adversarygraph.created_at,
      updated_at: repos.adversarygraph.updated_at,
      pushed_at: repos.adversarygraph.pushed_at,
      release: releases.adversarygraph.tag,
      release_url: releases.adversarygraph.url,
    },
    aidebug: {
      url: repos.aidebug.html_url,
      stars: repos.aidebug.stargazers_count,
      forks: repos.aidebug.forks_count,
      watchers: repos.aidebug.watchers_count,
      open_issues: repos.aidebug.open_issues_count,
      created_at: repos.aidebug.created_at,
      updated_at: repos.aidebug.updated_at,
      pushed_at: repos.aidebug.pushed_at,
      release: releases.aidebug.tag,
      release_url: releases.aidebug.url,
    },
    top_by_stars: topPublicRepos,
  },
  clone_traffic: {
    last_14_days: last14Days,
    cumulative: cumulativeClones,
  },
};

stats.totals = {
  open_upstream_items: stats.github.open_prs + stats.gitlab.open_mrs,
  merged_external_items: stats.github.merged_prs + stats.gitlab.merged_mrs,
  github_public_repos: publicRepos.length,
  github_forked_repos: publicRepos.filter(repo => repo.fork).length,
  github_source_repos: publicRepos.filter(repo => !repo.fork).length,
  github_total_stars: publicRepos.reduce((total, repo) => total + repo.stargazers_count, 0),
  github_total_forks: publicRepos.reduce((total, repo) => total + repo.forks_count, 0),
  aidebug_adversarygraph_stars: stats.repositories.aidebug.stars + stats.repositories.adversarygraph.stars,
  aidebug_adversarygraph_forks: stats.repositories.aidebug.forks + stats.repositories.adversarygraph.forks,
  github_followers: stats.profile.followers,
};

mkdirSync(path.dirname(statsPath), { recursive: true });
writeFileSync(statsPath, `${JSON.stringify(stats, null, 2)}\n`);

let html = readFileSync(pagePath, 'utf8');

html = replaceOrThrow(
  html,
  /<span class="count">Verified \d{4}-\d{2}-\d{2}<\/span>/,
  `<span class="count">Verified ${todayIsoDate()}</span>`,
  'snapshot verification date',
);
html = replaceOrThrow(
  html,
  /<div><strong>\d+<\/strong><span>Approved external PRs<\/span><\/div>/,
  `<div><strong>${stats.totals.merged_external_items}</strong><span>Approved external PRs</span></div>`,
  'merged PR count',
);
html = replaceOrThrow(
  html,
  /<div><strong>\d+<\/strong><span>Open upstream submissions<\/span><\/div>/,
  `<div><strong>${stats.totals.open_upstream_items}</strong><span>Open upstream submissions</span></div>`,
  'open PR/MR count',
);
html = replaceOrThrow(
  html,
  /<p>(?:Submitted for maintainer review across CTI, malware, detection, cloud, AI, mobile, and lab lists\.|\d+ GitHub PRs and \d+ GitLab MRs? submitted for maintainer review across CTI, malware, detection, cloud, AI, mobile, and lab lists\.)<\/p>/,
  `<p>${stats.github.open_prs} GitHub PRs and ${stats.gitlab.open_mrs} GitLab MR${stats.gitlab.open_mrs === 1 ? '' : 's'} submitted for maintainer review across CTI, malware, detection, cloud, AI, mobile, and lab lists.</p>`,
  'open review description',
);
html = replaceOrThrow(
  html,
  /<div><strong>v[^<]+<\/strong><span>AIDebug release<\/span><\/div>/,
  `<div><strong>${stats.repositories.aidebug.release}</strong><span>AIDebug release</span></div>`,
  'AIDebug release metric',
);
html = replaceOrThrow(
  html,
  /<div><strong>v[^<]+<\/strong><span>AdversaryGraph release<\/span><\/div>/,
  `<div><strong>${stats.repositories.adversarygraph.release}</strong><span>AdversaryGraph release</span></div>`,
  'AdversaryGraph release metric',
);
html = replaceOrThrow(
  html,
  /<div><strong>\d+<\/strong><span>GitHub stars<\/span><\/div>/,
  `<div><strong>${stats.totals.github_total_stars}</strong><span>GitHub stars</span></div>`,
  'combined star count',
);
html = replaceOrThrow(
  html,
  /<p>(?:Combined live public stars for AIDebug and AdversaryGraph(?:, plus \d+ public forks,)? at verification time\.|Live public portfolio total across \d+ GitHub repositories, including \d+ (?:repository )?forks and \d+ combined stars for AIDebug plus AdversaryGraph\.|Live public portfolio total across \d+ GitHub repositories, including \d+ forked repositories, \d+ repository forks(?:, \d+ GitHub followers)?, and \d+ combined stars for AIDebug plus AdversaryGraph\.)<\/p>/,
  `<p>Live public portfolio total across ${stats.totals.github_public_repos} GitHub repositories, including ${stats.totals.github_forked_repos} forked repositories, ${stats.totals.github_total_forks} repository forks, ${stats.totals.github_followers} GitHub followers, and ${stats.totals.aidebug_adversarygraph_stars} combined stars for AIDebug plus AdversaryGraph.</p>`,
  'combined star description',
);
if (/<span>GitHub followers<\/span>/.test(html)) {
  html = replaceOrThrow(
    html,
    /<article class="card metric">\s+<div><strong>\d+<\/strong><span>GitHub followers<\/span><\/div>\s+<p>[^<]*<\/p>\s+<\/article>/,
    `<article class="card metric">
            <div><strong>${stats.totals.github_followers}</strong><span>GitHub followers</span></div>
            <p>Live public GitHub follower count for the anpa1200 account at verification time.</p>
          </article>`,
    'GitHub followers metric',
  );
} else {
  html = replaceOrThrow(
    html,
    /(<article class="card metric">\s+<div><strong>\d+<\/strong><span>GitHub stars<\/span><\/div>\s+<p>[^<]*<\/p>\s+<\/article>)/,
    `$1
          <article class="card metric">
            <div><strong>${stats.totals.github_followers}</strong><span>GitHub followers</span></div>
            <p>Live public GitHub follower count for the anpa1200 account at verification time.</p>
          </article>`,
    'GitHub followers metric insertion',
  );
}
html = replaceOrThrow(
  html,
  /<div><strong>[\d,]+<\/strong><span>Total clones — last 14 days<\/span><\/div>\s*<p>Combined clone count across \d+ active source repositories? \([^)]*\)\. [\d,]+ unique cloners portfolio-wide\.<\/p>/,
  `<div><strong>${last14Days.clones.toLocaleString('en-US')}</strong><span>Total clones — last 14 days</span></div>
            <p>Combined clone count across ${last14Days.repos} active source repositories (${formatDateRange(last14Days.since, last14Days.through)}). ${last14Days.uniques.toLocaleString('en-US')} unique cloners portfolio-wide.</p>`,
  'total clones last 14 days metric',
);
html = replaceOrThrow(
  html,
  /<div><strong>[\d,]+<\/strong><span>Total clones since tracking began<\/span><\/div>\s*<p>Cumulative clone count across (?:the same \d+ repositories|active repositories) since daily tracking started \([^)]*\)\. [\d,]+ unique cloners portfolio-wide, summed across days\.<\/p>/,
  `<div><strong>${cumulativeClones.clones.toLocaleString('en-US')}</strong><span>Total clones since tracking began</span></div>
            <p>Cumulative clone count across active repositories since daily tracking started (${formatDateRange(cumulativeClones.since, cumulativeClones.through)}). ${cumulativeClones.uniques.toLocaleString('en-US')} unique cloners portfolio-wide, summed across days.</p>`,
  'cumulative clones since tracking began metric',
);
html = replaceOrThrow(
  html,
  /<!-- BEGIN VALIDATION_SIGNAL -->[\s\S]*?<!-- END VALIDATION_SIGNAL -->/,
  `<!-- BEGIN VALIDATION_SIGNAL -->\n        ${renderValidationSignal()}\n        <!-- END VALIDATION_SIGNAL -->`,
  'repository and review signal block',
);
html = replaceOrThrow(
  html,
  /<span class="chip release">Release v[^<]+<\/span>(\s+<span class="chip release">PyPI 1\.1\.0<\/span>[\s\S]*?)<span class="chip">\d+ stars<\/span>\s+<span class="chip">\d+ fork<\/span>/,
  `<span class="chip release">Release ${stats.repositories.aidebug.release}</span>$1<span class="chip">${stats.repositories.aidebug.stars} stars</span>\n              <span class="chip">${stats.repositories.aidebug.forks} fork${stats.repositories.aidebug.forks === 1 ? '' : 's'}</span>`,
  'AIDebug release chips',
);
html = replaceOrThrow(
  html,
  /<span class="chip release">Release v[^<]+<\/span>(\s+<span class="chip accepted">Green CI<\/span>[\s\S]*?)<span class="chip">\d+ stars<\/span>\s+<span class="chip">\d+ fork(?:s)?<\/span>/,
  `<span class="chip release">Release ${stats.repositories.adversarygraph.release}</span>$1<span class="chip">${stats.repositories.adversarygraph.stars} stars</span>\n              <span class="chip">${stats.repositories.adversarygraph.forks} fork${stats.repositories.adversarygraph.forks === 1 ? '' : 's'}</span>`,
  'AdversaryGraph release chips',
);
html = replaceOrThrow(
  html,
  /https:\/\/github\.com\/anpa1200\/adversarygraph\/releases\/tag\/v[^"]+/g,
  stats.repositories.adversarygraph.release_url || `https://github.com/anpa1200/adversarygraph/releases/tag/${stats.repositories.adversarygraph.release}`,
  'AdversaryGraph release URL',
);
html = replaceOrThrow(
  html,
  /https:\/\/github\.com\/anpa1200\/AIDebug\/releases\/tag\/v[^"]+/g,
  stats.repositories.aidebug.release_url || `https://github.com/anpa1200/AIDebug/releases/tag/${stats.repositories.aidebug.release}`,
  'AIDebug release URL',
);

writeFileSync(pagePath, html);
console.log(`Updated external-validation.html: ${stats.totals.merged_external_items} merged PR/MR, ${stats.totals.open_upstream_items} open PR/MR, ${stats.totals.github_total_stars} total stars, ${stats.totals.github_total_forks} total forks, ${stats.totals.github_followers} GitHub followers.`);
