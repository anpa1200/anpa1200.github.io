#!/usr/bin/env node
import process from 'node:process';

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const zoneId = process.env.CLOUDFLARE_ZONE_ID;

if (!apiToken || !zoneId) {
  console.error('Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID.');
  process.exit(1);
}

const records = [
  {
    type: 'TXT',
    name: '_index._agents.1200km.com',
    content: 'v=aid1; index=https://1200km.com/agent-index.md; llms=https://1200km.com/llms.txt',
  },
  {
    type: 'TXT',
    name: '_mcp._agents.1200km.com',
    content: 'v=aid1; mcp=https://1200km.com/.well-known/mcp/server-card.json',
  },
  {
    type: 'TXT',
    name: '_a2a._agents.1200km.com',
    content: 'v=aid1; skills=https://1200km.com/.well-known/agent-skills/index.json',
  },
];

async function cf(path, options = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(`${options.method || 'GET'} ${path} failed: ${JSON.stringify(body.errors || body)}`);
  }
  return body.result;
}

for (const record of records) {
  const existing = await cf(
    `/zones/${zoneId}/dns_records?type=${encodeURIComponent(record.type)}&name=${encodeURIComponent(record.name)}`,
  );
  const payload = {
    ...record,
    ttl: 1,
    comment: '1200km AI Agent Readiness DNS-AID discovery record',
  };
  if (existing.length) {
    await cf(`/zones/${zoneId}/dns_records/${existing[0].id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    console.log(`updated ${record.name}`);
  } else {
    await cf(`/zones/${zoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    console.log(`created ${record.name}`);
  }
}

console.log('DNS-AID TXT records upserted. Enable DNSSEC in Cloudflare for authenticated DNS responses.');
