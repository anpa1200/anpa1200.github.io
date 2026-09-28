// Pure, offline collection-contract checks. These are not TTP detectors.
export function validateFixture(fixture, contract) {
  const errors = [];
  if (fixture?.schema !== '1200km.ttp.collection-fixture.v1') errors.push('Unexpected fixture schema');
  if (fixture?.synthetic !== true) errors.push('Fixture must be explicitly synthetic');
  if (fixture?.technique_key !== contract.key) errors.push('Technique context mismatch');
  if (!Array.isArray(fixture?.events) || fixture.events.length === 0) errors.push('No collection events');
  const sources = new Map(contract.telemetry.map(r => [r.id, r]));
  for (const [index, event] of (Array.isArray(fixture?.events) ? fixture.events : []).entries()) {
    const source = sources.get(event.telemetry_id);
    if (!source) { errors.push(`Event ${index}: unmapped telemetry`); continue; }
    if (!Number.isFinite(Date.parse(event.timestamp))) errors.push(`Event ${index}: invalid timestamp`);
    for (const field of source.required_fields) {
      if (!Object.hasOwn(event.observation || {}, field) || event.observation[field] === null) errors.push(`Event ${index}: missing ${field}`);
    }
  }
  return { passed: errors.length === 0, errors, boundary: 'Collection schema only; no attack or detection execution.' };
}

export function collectionFixture(workbook) {
  return {
    schema: '1200km.ttp.collection-fixture.v1', synthetic: true, technique_key: workbook.key,
    purpose: 'Collection/parser contract exercise, NOT a positive example or detection of this TTP.',
    events: workbook.telemetry.map(r => ({ ...r.example, telemetry_id: r.id })),
  };
}

// Design lenses are attached to collection types, not asserted as TTP coverage.
export const featureLenses = {
  'Network and protocol telemetry': 'Per source and observation point: connection rate, destination-host/port fan-out, response/failure ratio and previously unseen destinations. Compare equivalent time windows; separate authorized scanners, NAT and sampling effects.',
  'Endpoint activity': 'Per host role and user: rare process/object combinations, bursts of object access or modification, and ordered parent/action sequences. Compare maintenance windows and signed software rollout activity.',
  'Script and command execution': 'Per host role and principal: rare interpreters, command argument patterns and parent-child sequences. Normalize scripts carefully; obfuscation, administrative automation and missing command lines change visibility.',
  'Windows and directory audit': 'Per principal, host and object: unusual access/request rates, new principal-object relationships, and changes outside approved administration windows. Control for service accounts and scheduled directory maintenance.',
  'Identity and SaaS': 'Per identity and application: first-seen clients/resources, changes in authentication failures and session patterns, and unusual permission changes. Separate automation, travel, shared egress and identity-provider policy changes.',
  'Cloud control plane': 'Per account, role, region and API: rare actions, new role-resource relationships, enumeration bursts and configuration changes. Separate deployment automation and organization-level administrative activity.',
  'Cloud storage': 'Per principal and bucket/container: unusual object-read counts, transferred volume, new access pairs and bulk permission/deletion activity. Model backups, migrations and lifecycle policies separately.',
  'Container runtime': 'Per workload image and namespace: rare process starts, unexpected image/privilege changes and new network relationships. Use workload/deployment identity, not short-lived container IDs alone.',
  'Kubernetes': 'Per service account and namespace: rare API verbs/resources, exec sessions and role-binding changes. Separate controllers, GitOps reconciliation and emergency operations.',
  'Application and service audit': 'Per application, client and route: request rate, rare actions, failure ratios and unusual state transitions. Version changes, retries, health probes and seasonal load need separate baselines.',
  'Host state and inventory': 'Compare authorized state snapshots: first-seen drivers/services/modules, unexpected configuration drift and integrity changes. Record collection cadence; absence in a sample is not evidence of deletion.',
  'Mobile lab instrumentation': 'Per owned device, app version and permission state: unexpected API/permission changes, background activity and network destinations. OS privacy restrictions and emulator differences limit observability.',
  'Industrial operations and physical process': 'Per asset, operating mode and engineering change window: deviations in command/state sequences, measurement residuals and communication freshness. Use a simulator or approved test rig; never generate hazardous physical effects.',
  'External context and intelligence': 'Changes in external infrastructure, registration or published intelligence can supply context. They do not expose private attacker actions or establish a victim-side detector; preserve timestamps and attribution uncertainty.',
  'Sample analysis and intelligence': 'Compare sample metadata, behavior traces and structural characteristics against an appropriate analysis corpus. Sample availability and sandbox execution differ from observing a compromise on a protected asset.',
};
