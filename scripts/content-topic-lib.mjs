export const TOPIC_RULES = Object.freeze([
  ['AdversaryGraph', /adversarygraph|threatmapper/i],
  ['MITRE ATT&CK', /mitre|att&ck|attack technique|\bT\d{4}(?:\.\d{3})?\b|\bG\d{4}\b/i],
  ['Cyber threat intelligence', /\bcti\b|threat intelligence|threat actor|ioc|indicator of compromise/i],
  ['Threat hunting', /threat hunt|hunting hypothesis|hunt quer/i],
  ['Detection engineering', /detection engineer|sigma|yara|siem|telemetry|detection rule/i],
  ['Identity security', /identity|itdr|active directory|kerberos|entra|iam/i],
  ['Malware analysis', /malware|reverse engineering|sandbox|static analysis|dynamic analysis/i],
  ['AI security', /\bai\b|artificial intelligence|\bllm\b|rag|mcp|agentic/i],
  ['Offensive security', /offensive|penetration test|red team|exploit|attack simulation/i],
  ['Incident response', /incident response|\bir\b|forensic|containment/i],
  ['Cloud security', /cloud|aws|azure|gcp|kubernetes|container/i],
  ['Embedded security', /embedded|firmware|hardware|uefi|iot|bmc/i],
]);

export function topicsFromText(value, maximum = 6) {
  return TOPIC_RULES.filter(([, pattern]) => pattern.test(value)).map(([name]) => name).slice(0, maximum);
}
