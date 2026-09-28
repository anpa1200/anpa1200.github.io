import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function packLegacySnapshot({files,workspace,output,site,capturedAt=new Date().toISOString()}) {
  const entries=files.map(entry=>({...entry,archived:entry.path.startsWith('pagefind/')
    || /\.(?:js|css|woff2?|ttf|otf)$/.test(entry.path) || !existsSync(join(site,entry.path))}));
  const retained=entries.filter(entry=>entry.archived);
  for(const entry of entries)assert.ok(safeLegacyAsset(entry.path),entry.path);
  await mkdir(output,{recursive:true});
  const archive='legacy-assets-20260928.tar.gz';
  execFileSync('tar',['--sort=name','--mtime=2026-09-28T00:00:00Z','--owner=0','--group=0','--numeric-owner','-czf',join(output,archive),'-C',workspace,'--null','--files-from=-'],
    {input:Buffer.from(retained.map(entry=>'./'+entry.path).sort().join('\0')+'\0')});
  const archiveBytes=await readFile(join(output,archive));
  assert.ok(archiveBytes.length<100*1024*1024,'Compatibility snapshot exceeds GitHub file limit');
  const manifest={schema_version:1,captured_at:capturedAt,archive,
    archive_sha256:createHash('sha256').update(archiveBytes).digest('hex'),files:entries.sort((a,b)=>a.path.localeCompare(b.path))};
  await writeFile(join(output,'legacy-assets.json'),JSON.stringify(manifest,null,2)+'\n');
  return {files:entries.length,archived:retained.length,archive_bytes:archiveBytes.length,archive_sha256:manifest.archive_sha256};
}

export function webpackChunks(source, mount) {
  // Parse literal filename tables as data. Never evaluate downloaded JavaScript.
  const literal = source.match(/\.u=\w+=>"(assets\/js\/[A-Za-z0-9_.-]+\.js)"/);
  if (literal) return [`${mount}/${literal[1]}`];
  const match = source.match(/\.u=\w+=>"assets\/js\/"\+\(\(?\{([^}]+)\}\)?\[\w+\]\|\|\w+\)\+"\."\+\(?\{([^}]+)\}\)?\[\w+\]\+"\.js"/);
  assert.ok(match, `Unsupported published Webpack runtime: ${mount}`);
  const table = (text) => JSON.parse(`{${text.replace(/(\d+):/g, '"$1":')}}`);
  const names = table(match[1]), hashes = table(match[2]);
  return Object.entries(hashes).map(([id, hash]) => {
    assert.match(id, /^\d+$/); assert.match(hash, /^[a-f0-9]+$/);
    const name = names[id] || id; assert.match(name, /^[a-zA-Z0-9_-]+$/);
    return `${mount}/assets/js/${name}.${hash}.js`;
  });
}

export function safeLegacyAsset(path) {
  return /^(?:[A-Za-z0-9_-]+\/assets\/(?:js|css|images|media)\/|pagefind\/)[A-Za-z0-9_.~/-]+$/.test(path)
    && !path.split('/').some((part) => part === '..' || part === '.')
    && /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|avif|woff2?|ttf|otf|wasm|pagefind|pf_fragment|pf_index|pf_meta|pf_filter)$/.test(path);
}
