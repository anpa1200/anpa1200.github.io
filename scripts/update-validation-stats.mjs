import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(new URL('.', import.meta.url).pathname, '..');
const pagePath = path.join(repoRoot, 'external-validation.html');
const statsPath = path.join(repoRoot, 'assets', 'validation', 'stats.json');

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

function ghPrDetails(pr) {
  const nameWithOwner = pr.repository.nameWithOwner;
  const details = runJson('gh', ['api', `repos/${nameWithOwner}/pulls/${pr.number}`]);
  return {
    ...pr,
    canonical_state: details.state,
    merged_at: details.merged_at,
    closed_at: details.closed_at,
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
            <p>GitLab merge requests are included when authenticated GitLab data is available to the updater.</p>
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
  open_search: ghSearch(['--author', 'anpa1200', '--state', 'open', '--limit', '100']).map(ghPrDetails),
  merged_search: ghSearch(['--author', 'anpa1200', '--state', 'closed', '--merged', '--limit', '100']).map(ghPrDetails),
  closed_search: ghSearch(['--author', 'anpa1200', '--state', 'closed', '--limit', '100']).map(ghPrDetails),
};
github.open = github.open_search.filter(pr => pr.canonical_state === 'open' && !pr.merged_at);
github.merged = github.merged_search.filter(pr => pr.merged_at);
github.closed_unmerged = github.closed_search.filter(pr => pr.canonical_state === 'closed' && !pr.merged_at);

const gitlabMrs = runJson(
  'glab',
  ['api', 'merge_requests?scope=all&author_username=1200km&per_page=100&order_by=updated_at&sort=desc'],
  [],
);

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

const stats = {
  generated_at: new Date().toISOString(),
  github: {
    open_prs: github.open.length,
    merged_prs: github.merged.length,
    closed_unmerged_prs: github.closed_unmerged.length,
  },
  gitlab: {
    open_mrs: gitlabMrs.filter(mr => mr.state === 'opened').length,
    merged_mrs: gitlabMrs.filter(mr => mr.state === 'merged').length,
    closed_mrs: gitlabMrs.filter(mr => mr.state === 'closed').length,
    open_items: gitlabMrs
      .filter(mr => mr.state === 'opened')
      .map(mr => ({
        title: mr.title,
        url: mr.web_url,
        updated_at: mr.updated_at,
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
  /<div><strong>\d+<\/strong><span>Merged external PRs<\/span><\/div>/,
  `<div><strong>${stats.totals.merged_external_items}</strong><span>Merged external PRs</span></div>`,
  'merged PR count',
);
html = replaceOrThrow(
  html,
  /<div><strong>\d+<\/strong><span>Open upstream PRs(?:\/MRs)?<\/span><\/div>/,
  `<div><strong>${stats.totals.open_upstream_items}</strong><span>Open upstream PRs/MRs</span></div>`,
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
  /<!-- BEGIN VALIDATION_SIGNAL -->[\s\S]*?<!-- END VALIDATION_SIGNAL -->/,
  `<!-- BEGIN VALIDATION_SIGNAL -->\n        ${renderValidationSignal()}\n        <!-- END VALIDATION_SIGNAL -->`,
  'repository and review signal block',
);
html = replaceOrThrow(
  html,
  /<span class="chip release">Release v[^<]+<\/span>(\s+<span class="chip release">PyPI 1\.1\.0<\/span>[\s\S]*?<span class="chip">Python<\/span>\s+)<span class="chip">\d+ stars<\/span>\s+<span class="chip">\d+ fork<\/span>/,
  `<span class="chip release">Release ${stats.repositories.aidebug.release}</span>$1<span class="chip">${stats.repositories.aidebug.stars} stars</span>\n              <span class="chip">${stats.repositories.aidebug.forks} fork${stats.repositories.aidebug.forks === 1 ? '' : 's'}</span>`,
  'AIDebug release chips',
);
html = replaceOrThrow(
  html,
  /<span class="chip release">Release v[^<]+<\/span>(\s+<span class="chip accepted">Green CI<\/span>[\s\S]*?<span class="chip">Self-hosted<\/span>(?:\s+<span class="chip">Malware Analysis<\/span>)?\s+)<span class="chip">\d+ stars<\/span>\s+<span class="chip">\d+ fork(?:s)?<\/span>/,
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
