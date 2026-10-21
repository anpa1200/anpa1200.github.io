// Preserve aggregate-only history. New daily records retain repository identity
// so overlap is replaced, never added twice, and removed repositories survive.
const count = n => { if (!Number.isSafeInteger(n) || n < 0) throw Error('Invalid clone counter'); return n; };
const iso = date => date.toISOString().slice(0, 10);
const dates = (since, through) => {
  const out=[]; for(let d=new Date(`${since}T00:00:00Z`);iso(d)<=through;d.setUTCDate(d.getUTCDate()+1))out.push(iso(d)); return out;
};
export function collectClones(previous, originalHistory, names, api, now=new Date()) {
  if (!names.length) throw Error('No clone repository inventory');
  const stats=structuredClone(previous), history=structuredClone(originalHistory);
  const today=iso(now), since=iso(new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()-14))), through=iso(new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()-1)));
  history.aggregate_only_through ??= Object.keys(history.days).sort().at(-1) || history.baseline?.through;
  history.daily_by_repository ??= {};
  const traffic={observed_at:now.toISOString(),since,through,scope:'Current public non-fork source repositories; completed UTC dates only',repositories:{}};
  const windowDays=dates(since,through); let clones=0,dailyUniques=0,active=0;
  const toolWindows={};
  for (const name of names) {
    const raw=api(`repos/${name}/traffic/clones`);
    if (!raw || !Array.isArray(raw.clones)) throw Error(`Unavailable clone traffic: ${name}`);
    count(raw.count);count(raw.uniques);
    const byDate=new Map();
    for(const item of raw.clones) {
      const date=item.timestamp?.slice(0,10);
      if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'') || byDate.has(date))throw Error(`Invalid or duplicate clone date: ${name}`);
      byDate.set(date,{clones:count(item.count),uniques:count(item.uniques)});
    }
    if ([...byDate.values()].reduce((sum,day)=>sum+day.clones,0) !== raw.count) throw Error(`Inconsistent clone response: ${name}`);
    let repoClones=0,repoDailyUniques=0;
    for(const date of windowDays) {
      // GitHub omits zero-activity days in a successfully returned window.
      // No zeros are inferred outside this bounded rolling response.
      const day=byDate.get(date)||{clones:0,uniques:0};repoClones+=day.clones;repoDailyUniques+=day.uniques;
      if(date>history.aggregate_only_through) {
        history.daily_by_repository[date]??={};history.daily_by_repository[date][name]=day;
      }
    }
    clones+=repoClones;dailyUniques+=repoDailyUniques;if(repoClones)active++;
    toolWindows[name]={since,through,clones:repoClones,summed_daily_unique_values:repoDailyUniques};
    traffic.repositories[name]=raw;
  }
  for(const [date,repos] of Object.entries(history.daily_by_repository)) {
    // Previously observed repositories absent from today's inventory are retained.
    history.days[date]={clones:Object.values(repos).reduce((a,v)=>a+v.clones,0),uniques:Object.values(repos).reduce((a,v)=>a+v.uniques,0)};
  }
  const latest=Object.keys(history.days).sort().at(-1)||history.baseline.through;
  const missing=dates(iso(new Date(new Date(`${history.baseline.through}T00:00:00Z`).getTime()+86400000)),latest).filter(date=>!Object.hasOwn(history.days,date));
  const cumulative={since:history.tracking_started,through:latest,clones:(history.baseline?.clones||0)+Object.values(history.days).reduce((n,d)=>n+d.clones,0),uniques:null,status:missing.length?'observed-incomplete':'observed-record',missing_dates:missing,limitations:'Observed events only; historical and current repository inventories differ. Missing dates are unknown, not zero. No lifetime completeness or distinct-user claim.'};
  history.updated_at=now.toISOString();history.coverage={status:cumulative.status,missing_dates:missing,current_source_repositories:names.length,limitations:cumulative.limitations};
  stats.clone_traffic.historical_cumulative ??= { since:history.tracking_started, through:history.aggregate_only_through, clones:(history.baseline?.clones||0)+Object.entries(history.days).filter(([date])=>date<=history.aggregate_only_through).reduce((sum,[,day])=>sum+day.clones,0) };
  if(previous.clone_traffic.status==='historical-not-refreshed')stats.clone_traffic.historical_window=structuredClone(previous.clone_traffic.last_14_days);
  const current={since,through,clones,repos:names.length,active_repos:active,calendar_date_entries:14,summed_daily_repository_unique_values:dailyUniques,label:'Last 14 completed UTC dates returned by authenticated GitHub traffic API',uniques_definition:'Sum of per-repository daily unique counters; not deduplicated people or window-unique cloners.'};
  Object.assign(stats.clone_traffic,{last_14_days:current,current_window:current,cumulative,by_repository:toolWindows,status:'current-window-with-incomplete-history',observed_at:now.toISOString(),limitations:[cumulative.limitations,current.uniques_definition,'Boundary dates before the selected window and the accumulating current UTC day are excluded.']});
  stats.aidebug_distribution.current_clone_count=toolWindows['anpa1200/AIDebug']?.clones??null;
  stats.aidebug_distribution.clone_window={since,through,observed_at:now.toISOString()};
  stats.verification.clone_traffic_through=through;
  return {stats,history,traffic};
}
const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;');
const number=n=>n.toLocaleString('en-US');
export function renderCloneMetrics(stats) {
  const w=stats.clone_traffic.current_window,c=stats.clone_traffic.cumulative,a=stats.clone_traffic.by_repository['anpa1200/AIDebug'];
  if(!w||!a)throw Error('Missing current clone metrics');
  const gaps=c.missing_dates.length?` Dates without complete retained coverage: ${c.missing_dates.map(esc).join(', ')}. Those dates are unknown, not zero; partial API boundary records are excluded.`:'';
  return `<article class="card metric"><div><strong>${number(w.clones)}</strong><span>Clone events — last 14 completed UTC days</span></div><p>Fresh authenticated GitHub traffic for ${esc(w.since)}–${esc(w.through)}, checked ${esc(stats.clone_traffic.observed_at.slice(0,10))}. Sum across ${w.repos} current public source repositories (${w.active_repos} with clone events). Current-day and older partial boundary data are excluded. Clone events are not users.</p></article>
          <article class="card metric"><div><strong>${number(a.clones)}</strong><span>AIDebug clone events — same window</span></div><p>AIDebug-specific GitHub clone events for ${esc(a.since)}–${esc(a.through)}. These are clone operations, not package downloads, distinct users, or proof of REMnux usage. <a href="assets/validation/clone-traffic.json">Recorded API observations</a>.</p></article>
          <article class="card metric"><div><strong>${number(c.clones)}</strong><span>Observed cumulative clone events — incomplete</span></div><p>Retained observations for ${esc(c.since)}–${esc(c.through)}: the historical ${number(stats.clone_traffic.historical_cumulative.clones)} through ${esc(stats.clone_traffic.historical_cumulative.through)} plus newly observed dates, counted once.${gaps} Repository coverage changes over time; this is not a complete lifetime total. The original baseline and historical days are preserved.</p></article>`;
}
