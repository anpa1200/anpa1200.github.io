// Exact archived third-party source captures, not authored site pages. Preserve
// their bytes/URLs as downloads; do not index them or execute their scripts.
export const EVIDENCE_DOCUMENTS = new Map([
  ['anomaly-detection-atlas/reports/cti-ir/f5-2024-ddos-attack-trends.html', '154a109c38e560b3bd6b26bd50fe681c6a3dfea4216adff23008b535b96d875e'],
  ['anomaly-detection-atlas/reports/cti-ir/mandiant-sunburst-supply-chain.html', 'df4bc58bc5ab99ff7a5984cf5e7c2ab8d0fb2741cfd250f19358be143e9e72b9'],
  ['anomaly-detection-atlas/reports/cti-ir/sysdig-ai-assisted-cloud-intrusion.html', '65f794a02f981925a2b88258407c9d4261ef5d45ed7e79bae2a7da0b40ffc076'],
  ['anomaly-detection-atlas/reports/cti-ir/sysdig-scarleteel.html', 'c1f10cf0f420bc9555a4f763ceaa831f9ebc21feaa51986ff6a5382ff74bf775'],
  ['anomaly-detection-atlas/reports/cti-ir/sysdig-scarleteel-mitre.html', 'f38165213b22d17c59f7f14587ca2cebd8ae02788bb30dc86e0774802dfa0507'],
  ['anomaly-detection-atlas/reports/cti-ir/sysdig-teamtnt-kubelet.html', '5199bdb28501783aec36e9cb98658d0e97138ad9721e89c58a799423427a8cc4'],
]);
export const isEvidenceDocument = (path) => EVIDENCE_DOCUMENTS.has(path.replace(/^\//, ''));
