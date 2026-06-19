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
  if (!pattern.test(html)) throw new Error(`Could not update ${label}`);
  return html.replace(pattern, replacement);
}

const github = {
  open: ghSearch(['--author', 'anpa1200', '--state', 'open', '--limit', '100']),
  merged: ghSearch(['--author', 'anpa1200', '--state', 'closed', '--merged', '--limit', '100']),
  closed: ghSearch(['--author', 'anpa1200', '--state', 'closed', '--limit', '100']),
};
github.closed_unmerged = github.closed.filter(pr => pr.state !== 'merged');

const gitlabMrs = runJson(
  'glab',
  ['api', 'merge_requests?scope=all&author_username=1200km&per_page=100&order_by=updated_at&sort=desc'],
  [],
);

const repos = {
  adversarygraph: ghRepo('anpa1200/adversarygraph'),
  aidebug: ghRepo('anpa1200/AIDebug'),
};
const publicRepos = ghUserRepos('anpa1200');

const releases = {
  adversarygraph: ghLatestRelease('anpa1200/adversarygraph', 'v2.1.1'),
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
  },
  repositories: {
    adversarygraph: {
      stars: repos.adversarygraph.stargazers_count,
      forks: repos.adversarygraph.forks_count,
      release: releases.adversarygraph.tag,
      release_url: releases.adversarygraph.url,
    },
    aidebug: {
      stars: repos.aidebug.stargazers_count,
      forks: repos.aidebug.forks_count,
      release: releases.aidebug.tag,
      release_url: releases.aidebug.url,
    },
  },
};

stats.totals = {
  open_upstream_items: stats.github.open_prs + stats.gitlab.open_mrs,
  merged_external_items: stats.github.merged_prs + stats.gitlab.merged_mrs,
  github_public_repos: publicRepos.length,
  github_forked_repos: publicRepos.filter(repo => repo.fork).length,
  github_total_stars: publicRepos.reduce((total, repo) => total + repo.stargazers_count, 0),
  github_total_forks: publicRepos.reduce((total, repo) => total + repo.forks_count, 0),
  aidebug_adversarygraph_stars: stats.repositories.aidebug.stars + stats.repositories.adversarygraph.stars,
  aidebug_adversarygraph_forks: stats.repositories.aidebug.forks + stats.repositories.adversarygraph.forks,
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
  /<p>(?:Combined live public stars for AIDebug and AdversaryGraph(?:, plus \d+ public forks,)? at verification time\.|Live public portfolio total across \d+ GitHub repositories, including \d+ forks and \d+ combined stars for AIDebug plus AdversaryGraph\.)<\/p>/,
  `<p>Live public portfolio total across ${stats.totals.github_public_repos} GitHub repositories, including ${stats.totals.github_total_forks} repository forks and ${stats.totals.aidebug_adversarygraph_stars} combined stars for AIDebug plus AdversaryGraph.</p>`,
  'combined star description',
);
html = replaceOrThrow(
  html,
  /<span class="chip release">Release v[^<]+<\/span>(\s+<span class="chip release">PyPI 1\.1\.0<\/span>[\s\S]*?<span class="chip">Python<\/span>\s+)<span class="chip">\d+ stars<\/span>\s+<span class="chip">\d+ fork<\/span>/,
  `<span class="chip release">Release ${stats.repositories.aidebug.release}</span>$1<span class="chip">${stats.repositories.aidebug.stars} stars</span>\n              <span class="chip">${stats.repositories.aidebug.forks} fork${stats.repositories.aidebug.forks === 1 ? '' : 's'}</span>`,
  'AIDebug release chips',
);
html = replaceOrThrow(
  html,
  /<span class="chip release">Release v[^<]+<\/span>(\s+<span class="chip accepted">Green CI<\/span>[\s\S]*?<span class="chip">Self-hosted<\/span>\s+)<span class="chip">\d+ stars<\/span>\s+<span class="chip">\d+ fork(?:s)?<\/span>/,
  `<span class="chip release">Release ${stats.repositories.adversarygraph.release}</span>$1<span class="chip">${stats.repositories.adversarygraph.stars} stars</span>\n              <span class="chip">${stats.repositories.adversarygraph.forks} fork${stats.repositories.adversarygraph.forks === 1 ? '' : 's'}</span>`,
  'AdversaryGraph release chips',
);
html = replaceOrThrow(
  html,
  /https:\/\/github\.com\/anpa1200\/adversarygraph\/releases\/tag\/v[^"]+/,
  stats.repositories.adversarygraph.release_url || `https://github.com/anpa1200/adversarygraph/releases/tag/${stats.repositories.adversarygraph.release}`,
  'AdversaryGraph release URL',
);
html = replaceOrThrow(
  html,
  /https:\/\/github\.com\/anpa1200\/AIDebug\/releases\/tag\/v[^"]+/,
  stats.repositories.aidebug.release_url || `https://github.com/anpa1200/AIDebug/releases/tag/${stats.repositories.aidebug.release}`,
  'AIDebug release URL',
);

writeFileSync(pagePath, html);
console.log(`Updated external-validation.html: ${stats.totals.merged_external_items} merged, ${stats.totals.open_upstream_items} open, ${stats.totals.aidebug_adversarygraph_stars} stars.`);
