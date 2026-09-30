// Vendor HTML captures are retired; no full third-party page is served locally.
export const EVIDENCE_DOCUMENTS = new Map();
export const isEvidenceDocument = (path) => EVIDENCE_DOCUMENTS.has(path.replace(/^\//, ''));

// Exact, reviewed publisher destinations preserve old inbound report URLs.
export const RETIRED_VENDOR_REPORTS = new Map([
  ['/anomaly-detection-atlas/reports/cti-ir/f5-2024-ddos-attack-trends.html', 'https://www.f5.com/labs/articles/2024-ddos-attack-trends'],
  ['/anomaly-detection-atlas/reports/cti-ir/mandiant-sunburst-supply-chain.html', 'https://cloud.google.com/blog/topics/threat-intelligence/evasive-attacker-leverages-solarwinds-supply-chain-compromises-with-sunburst-backdoor/'],
  ['/anomaly-detection-atlas/reports/cti-ir/sysdig-ai-assisted-cloud-intrusion.html', 'https://www.sysdig.com/blog/ai-assisted-cloud-intrusion-achieves-admin-access-in-8-minutes'],
  ['/anomaly-detection-atlas/reports/cti-ir/sysdig-scarleteel.html', 'https://www.sysdig.com/blog/cloud-breach-terraform-data-theft'],
  ['/anomaly-detection-atlas/reports/cti-ir/sysdig-scarleteel-mitre.html', 'https://www.sysdig.com/blog/scarleteel-mitre-attack'],
  ['/anomaly-detection-atlas/reports/cti-ir/sysdig-teamtnt-kubelet.html', 'https://www.sysdig.com/blog/teamtnt-kubelet-credentials'],
]);

export function retiredVendorReportTarget(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return null; }
  return RETIRED_VENDOR_REPORTS.get(decoded) || RETIRED_VENDOR_REPORTS.get(`${decoded}.html`) || null;
}
