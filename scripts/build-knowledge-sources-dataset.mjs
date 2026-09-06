import fs from 'node:fs';
import path from 'node:path';

const checkedOn = '2026-09-06';
const outputPath = 'data/knowledge-sources.json';
const checkMode = process.argv.includes('--check');
// URL health is a separately refreshed observation. Preserve its last reviewed
// snapshot during deterministic offline rebuilds; refresh-knowledge-sources
// replaces it through validate-knowledge-sources.mjs when network access is
// intentionally requested.
const existingDataset = fs.existsSync(outputPath)
  ? JSON.parse(fs.readFileSync(outputPath, 'utf8'))
  : null;
const validationById = new Map(
  (existingDataset?.sources || []).map((source) => [source.id, source.validation]),
);

// Consolidated from source names actually present in gemini_links_research.md and
// openai_links_research.md. URLs are canonical first-party entry points.
const rows = [
  ['Israel National Cyber Directorate','https://www.gov.il/en/departments/israel_national_cyber_directorate','government'],
  ['CISA Known Exploited Vulnerabilities Catalog','https://www.cisa.gov/known-exploited-vulnerabilities-catalog','vulnerability'],
  ['MITRE ATT&CK','https://attack.mitre.org/','threat-informed-defense'],
  ['MITRE ATLAS','https://atlas.mitre.org/','ai-security'],
  ['OWASP GenAI Security Project','https://genai.owasp.org/','ai-security'],
  ['Check Point Research','https://research.checkpoint.com/','threat-research'],
  ['SentinelOne Labs','https://www.sentinelone.com/labs/','threat-research'],
  ['arXiv Cryptography and Security','https://arxiv.org/list/cs.CR/recent','academic'],
  ['NCSC UK Guidance','https://www.ncsc.gov.uk/section/advice-guidance/all-topics','government'],
  ['NCSC Ireland Guidance','https://www.ncsc.gov.ie/guidance/','government'],
  ['ENISA Publications','https://www.enisa.europa.eu/publications','government'],
  ['FIRST CVSS v4.0','https://www.first.org/cvss/v4.0/','vulnerability'],
  ['NIST Cybersecurity Framework','https://www.nist.gov/cyberframework','framework'],
  ['NIST SP 800-53','https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final','framework'],
  ['NIST SP 800-207 Zero Trust Architecture','https://csrc.nist.gov/pubs/sp/800/207/final','framework'],
  ['NIST SP 800-61 Rev. 3','https://csrc.nist.gov/pubs/sp/800/61/r3/final','incident-response'],
  ['NIST AI Risk Management Framework','https://www.nist.gov/itl/ai-risk-management-framework','ai-security'],
  ['CIS Critical Security Controls','https://www.cisecurity.org/controls/cis-controls-list','framework'],
  ['NCSC Cyber Assessment Framework','https://www.ncsc.gov.uk/collection/cyber-assessment-framework','framework'],
  ['ASD Essential Eight','https://www.cyber.gov.au/business-government/asds-cyber-security-frameworks/essential-eight','framework'],
  ['MITRE D3FEND','https://d3fend.mitre.org/','threat-informed-defense'],
  ['Center for Threat-Informed Defense','https://ctid.mitre.org/','threat-informed-defense'],
  ['Atomic Red Team','https://github.com/redcanaryco/atomic-red-team','adversary-emulation'],
  ['Apache Caldera','https://caldera.apache.org/','adversary-emulation'],
  ['OASIS Open CTI Documentation','https://oasis-open.github.io/cti-documentation/','cti'],
  ['MISP','https://www.misp-project.org/','cti'],
  ['OpenCTI','https://docs.opencti.io/','cti'],
  ['ThreatFox','https://threatfox.abuse.ch/','cti'],
  ['URLhaus','https://urlhaus.abuse.ch/','cti'],
  ['Google Threat Intelligence','https://cloud.google.com/security/products/threat-intelligence','cti'],
  ['Cisco Talos Intelligence','https://www.talosintelligence.com/','threat-research'],
  ['Unit 42','https://unit42.paloaltonetworks.com/','threat-research'],
  ['CrowdStrike Global Threat Report','https://www.crowdstrike.com/en-us/global-threat-report/','threat-reports'],
  ['Verizon Data Breach Investigations Report','https://www.verizon.com/business/resources/reports/dbir/','threat-reports'],
  ['CERT-EU Publications','https://cert.europa.eu/publications/','incident-response'],
  ['JPCERT/CC','https://www.jpcert.or.jp/english/','incident-response'],
  ['Cyber Security Agency of Singapore','https://www.csa.gov.sg/resources/publications','government'],
  ['CVE Program','https://www.cve.org/','vulnerability'],
  ['National Vulnerability Database','https://nvd.nist.gov/','vulnerability'],
  ['FIRST EPSS','https://www.first.org/epss/','vulnerability'],
  ['Open Source Vulnerabilities','https://osv.dev/','vulnerability'],
  ['GitHub Advisory Database','https://github.com/advisories','vulnerability'],
  ['CERT/CC Vulnerability Notes','https://www.kb.cert.org/vuls/','vulnerability'],
  ['Zero Day Initiative','https://www.zerodayinitiative.com/advisories/published/','vulnerability'],
  ['Exploit Database','https://www.exploit-db.com/','exploit-development'],
  ['Sigma','https://sigmahq.io/','detection-engineering'],
  ['Elastic Detection Rules','https://github.com/elastic/detection-rules','detection-engineering'],
  ['Splunk Security Content','https://research.splunk.com/','detection-engineering'],
  ['Microsoft Sentinel Content Hub','https://learn.microsoft.com/en-us/azure/sentinel/sentinel-solutions-deploy','detection-engineering'],
  ['Google SecOps Community Rules','https://github.com/chronicle/detection-rules','detection-engineering'],
  ['The DFIR Report','https://thedfirreport.com/','dfir'],
  ['Volatility Foundation','https://volatilityfoundation.org/','dfir'],
  ['Velociraptor','https://docs.velociraptor.app/','dfir'],
  ['Plaso','https://plaso.readthedocs.io/en/latest/','dfir'],
  ['Timesketch','https://timesketch.org/','dfir'],
  ['Autopsy','https://www.autopsy.com/','dfir'],
  ['The Sleuth Kit','https://www.sleuthkit.org/','dfir'],
  ['REMnux','https://remnux.org/','malware-analysis'],
  ['YARA','https://virustotal.github.io/yara/','malware-analysis'],
  ['MalwareBazaar','https://bazaar.abuse.ch/','malware-analysis'],
  ['Malpedia','https://malpedia.caad.fkie.fraunhofer.de/','malware-analysis'],
  ['VirusTotal','https://www.virustotal.com/gui/','malware-analysis'],
  ['Ghidra','https://ghidra-sre.org/','reverse-engineering'],
  ['FLARE-VM','https://github.com/mandiant/flare-vm','malware-analysis'],
  ['IDA Free','https://hex-rays.com/ida-free','reverse-engineering'],
  ['Binary Ninja','https://binary.ninja/','reverse-engineering'],
  ['Cutter','https://cutter.re/','reverse-engineering'],
  ['OpenSecurityTraining2','https://p.ost2.fyi/','training'],
  ['LiveOverflow','https://liveoverflow.com/','training'],
  ['ROP Emporium','https://ropemporium.com/','exploit-development'],
  ['pwntools','https://docs.pwntools.com/en/latest/','exploit-development'],
  ['Metasploit Documentation','https://docs.metasploit.com/','penetration-testing'],
  ['Nmap Documentation','https://nmap.org/docs.html','network-security'],
  ['OWASP Top 10','https://owasp.org/www-project-top-ten/','application-security'],
  ['OWASP ASVS','https://owasp.org/www-project-application-security-verification-standard/','application-security'],
  ['OWASP Web Security Testing Guide','https://owasp.org/www-project-web-security-testing-guide/','web-security'],
  ['OWASP API Security Project','https://owasp.org/www-project-api-security/','api-security'],
  ['OWASP Cheat Sheet Series','https://cheatsheetseries.owasp.org/','application-security'],
  ['PortSwigger Web Security Academy','https://portswigger.net/web-security','training'],
  ['PortSwigger Research','https://portswigger.net/research','web-security'],
  ['Semgrep','https://docs.semgrep.dev/','application-security'],
  ['CodeQL','https://codeql.github.com/docs/','application-security'],
  ['OSS-Fuzz','https://google.github.io/oss-fuzz/','application-security'],
  ['Cloud Security Alliance Cloud Controls Matrix','https://cloudsecurityalliance.org/research/cloud-controls-matrix','cloud-security'],
  ['AWS Security Best Practices','https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html','cloud-security'],
  ['Microsoft Azure Security Documentation','https://learn.microsoft.com/en-us/azure/security/','cloud-security'],
  ['Google Cloud Security Best Practices','https://cloud.google.com/security/best-practices','cloud-security'],
  ['Kubernetes Security Documentation','https://kubernetes.io/docs/concepts/security/','kubernetes'],
  ['CIS Kubernetes Benchmark','https://www.cisecurity.org/benchmark/kubernetes','kubernetes'],
  ['Trivy','https://trivy.dev/','container-security'],
  ['Kubescape','https://kubescape.io/','kubernetes'],
  ['Prowler','https://docs.prowler.com/introduction','cloud-security'],
  ['Stratus Red Team','https://stratus-red-team.cloud/','cloud-security'],
  ['OWASP MASVS','https://mas.owasp.org/MASVS/','mobile-security'],
  ['OWASP MASTG','https://mas.owasp.org/MASTG/','mobile-security'],
  ['Android Security','https://source.android.com/docs/security','mobile-security'],
  ['Apple Platform Security','https://support.apple.com/guide/security/welcome/web','mobile-security'],
  ['MobSF','https://mobsf.github.io/docs/','mobile-security'],
  ['Frida','https://frida.re/docs/home/','mobile-security'],
  ['BloodHound','https://bloodhound.specterops.io/home','identity-security'],
  ['SpecterOps Research','https://specterops.io/resources/','identity-security'],
  ['ADSecurity.org','https://adsecurity.org/','identity-security'],
  ['PingCastle','https://www.pingcastle.com/','identity-security'],
  ['Purple Knight','https://www.semperis.com/purple-knight/','identity-security'],
  ['Microsoft Entra Documentation','https://learn.microsoft.com/en-us/entra/','identity-security'],
  ['Google Secure AI Framework','https://saif.google/','ai-security'],
  ['NCSC AI Security Guidance','https://www.ncsc.gov.uk/collection/guidelines-secure-ai-system-development','ai-security'],
  ['PyRIT','https://github.com/microsoft/PyRIT','ai-security'],
  ['garak','https://github.com/NVIDIA/garak','ai-security'],
  ['Promptfoo','https://www.promptfoo.dev/docs/','ai-security'],
  ['CSA AI Controls Matrix','https://cloudsecurityalliance.org/artifacts/ai-controls-matrix-v1-1','ai-security'],
  ['Security Onion','https://securityonionsolutions.com/software/','soc'],
  ['Zeek','https://zeek.org/','network-security'],
  ['Suricata','https://suricata.io/','network-security'],
  ['Wireshark','https://www.wireshark.org/','network-security'],
  ['TryHackMe','https://tryhackme.com/','training'],
  ['OverTheWire','https://overthewire.org/wargames/','training'],
  ['LetsDefend','https://letsdefend.io/','training'],
  ['CyberDefenders','https://cyberdefenders.org/','training'],
  ['PentesterLab','https://pentesterlab.com/','training'],
  ['Hack The Box Academy','https://academy.hackthebox.com/','training'],
  ['USENIX Security Symposium','https://www.usenix.org/conferences/byname/108','academic'],
  ['Stratosphere IPS Datasets','https://www.stratosphereips.org/datasets-overview','datasets'],
  ['UNB CIC Datasets','https://www.unb.ca/cic/datasets/','datasets'],
  ['Malware-Traffic-Analysis.net','https://www.malware-traffic-analysis.net/','training'],
];

const slug = (value) => value.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Source kind is an explicit editorial classification, not a hostname or
// vendor-name guess. Every registry row must occur in exactly one group.
const sourceKindGroups = new Map([
  ['government', new Set([
    'Israel National Cyber Directorate', 'CISA Known Exploited Vulnerabilities Catalog',
    'NCSC UK Guidance', 'NCSC Ireland Guidance', 'ENISA Publications',
    'NIST Cybersecurity Framework', 'NIST SP 800-53', 'NIST SP 800-207 Zero Trust Architecture',
    'NIST SP 800-61 Rev. 3', 'NIST AI Risk Management Framework',
    'NCSC Cyber Assessment Framework', 'ASD Essential Eight', 'CERT-EU Publications',
    'Cyber Security Agency of Singapore', 'National Vulnerability Database',
    'NCSC AI Security Guidance'
  ])],
  ['standards-body', new Set([
    'FIRST CVSS v4.0', 'OASIS Open CTI Documentation', 'FIRST EPSS'
  ])],
  ['academic', new Set([
    'arXiv Cryptography and Security', 'USENIX Security Symposium',
    'Stratosphere IPS Datasets', 'UNB CIC Datasets'
  ])],
  ['nonprofit-technical', new Set([
    'MITRE ATT&CK', 'MITRE ATLAS', 'OWASP GenAI Security Project',
    'CIS Critical Security Controls', 'MITRE D3FEND', 'Center for Threat-Informed Defense',
    'JPCERT/CC', 'CVE Program', 'CERT/CC Vulnerability Notes', 'Volatility Foundation',
    'Malpedia', 'OpenSecurityTraining2', 'OWASP Top 10', 'OWASP ASVS',
    'OWASP Web Security Testing Guide', 'OWASP API Security Project',
    'OWASP Cheat Sheet Series', 'Cloud Security Alliance Cloud Controls Matrix',
    'CIS Kubernetes Benchmark', 'OWASP MASVS', 'OWASP MASTG', 'CSA AI Controls Matrix'
  ])],
  ['open-source-project', new Set([
    'Atomic Red Team', 'Apache Caldera', 'MISP', 'Open Source Vulnerabilities', 'Sigma',
    'Velociraptor', 'Plaso', 'Timesketch', 'Autopsy', 'The Sleuth Kit', 'REMnux', 'YARA',
    'Ghidra', 'FLARE-VM', 'Cutter', 'pwntools', 'Nmap Documentation', 'OSS-Fuzz',
    'Kubernetes Security Documentation', 'Trivy', 'Kubescape', 'Stratus Red Team',
    'Android Security', 'MobSF', 'Frida', 'PyRIT', 'garak', 'Zeek', 'Suricata', 'Wireshark'
  ])],
  ['open-core', new Set([
    'OpenCTI', 'Metasploit Documentation', 'Semgrep', 'Prowler', 'PingCastle',
    'BloodHound', 'Promptfoo', 'Security Onion'
  ])],
  ['commercial-technical', new Set([
    'Check Point Research', 'SentinelOne Labs', 'Google Threat Intelligence',
    'Cisco Talos Intelligence', 'Unit 42', 'CrowdStrike Global Threat Report',
    'Verizon Data Breach Investigations Report', 'GitHub Advisory Database',
    'Zero Day Initiative', 'Exploit Database', 'Elastic Detection Rules',
    'Splunk Security Content', 'Microsoft Sentinel Content Hub', 'Google SecOps Community Rules',
    'The DFIR Report', 'VirusTotal', 'IDA Free', 'Binary Ninja',
    'PortSwigger Web Security Academy', 'PortSwigger Research', 'AWS Security Best Practices',
    'Microsoft Azure Security Documentation', 'Google Cloud Security Best Practices',
    'Apple Platform Security', 'SpecterOps Research', 'Purple Knight',
    'Microsoft Entra Documentation', 'Google Secure AI Framework', 'TryHackMe', 'LetsDefend',
    'CyberDefenders', 'PentesterLab', 'Hack The Box Academy'
  ])],
  ['independent-technical', new Set([
    'ThreatFox', 'URLhaus', 'MalwareBazaar', 'LiveOverflow', 'ROP Emporium',
    'ADSecurity.org', 'OverTheWire', 'Malware-Traffic-Analysis.net'
  ])],
  ['mixed-license-tool', new Set(['CodeQL'])]
]);
const sourceKindByName = new Map();
for (const [kind, names] of sourceKindGroups) {
  for (const name of names) {
    if (sourceKindByName.has(name)) throw new Error(`Duplicate source-kind classification for ${name}`);
    sourceKindByName.set(name, kind);
  }
}
const registryNames = new Set(rows.map(([name]) => name));
const missingSourceKinds = [...registryNames].filter((name) => !sourceKindByName.has(name));
const unknownSourceKinds = [...sourceKindByName.keys()].filter((name) => !registryNames.has(name));
if (missingSourceKinds.length || unknownSourceKinds.length) {
  throw new Error(`Source-kind registry mismatch; missing: ${missingSourceKinds.join(', ') || 'none'}; unknown: ${unknownSourceKinds.join(', ') || 'none'}`);
}
const safety = new Set(['MalwareBazaar','VirusTotal','Exploit Database','Atomic Red Team','Apache Caldera','Metasploit Documentation','Stratus Red Team','Malware-Traffic-Analysis.net','Frida','BloodHound']);
const safetyCautions = new Map([
  ['ThreatFox', 'Indicators can reference active malicious infrastructure; do not visit them directly or block shared infrastructure without age, confidence, ownership, and local-evidence checks.'],
  ['URLhaus', 'Records can contain active malware-delivery URLs; inspect only through controlled tooling and do not treat every export as a production blocklist.'],
  ['Zero Day Initiative', 'Vulnerability and exploitation details are dual-use; apply them only to authorized defensive research, validation, and remediation.'],
  ['Malware-Traffic-Analysis.net', 'Some exercises contain live-malware-derived artifacts or password-protected samples; use an authorized isolated lab and never execute them on production systems.'],
  ['Frida', 'Dynamic instrumentation is dual-use; test only software and devices you are authorized to assess.'],
  ['BloodHound', 'Collected identity graphs contain sensitive privilege and relationship data; protect collectors, exports, credentials, and the BloodHound service as security-sensitive assets.']
  ,['Stratosphere IPS Datasets', 'Some datasets contain malware-derived traffic or full-payload packet captures; use isolated analysis systems and follow each dataset’s handling and licensing terms.']
  ,['UNB CIC Datasets', 'Some downloads can contain malware or trigger harmful-software warnings; isolate analysis and follow each dataset’s stated handling, attribution, and licensing requirements.']
  ,['PyRIT', 'Run adversarial evaluations only against authorized targets; constrain credentials, stored prompts, model costs, and sensitive response data, and manually validate findings.']
  ,['garak', 'Probe only authorized AI targets; review plugins and payloads, limit cost and sensitive data exposure, and validate automated detector results.']
  ,['Promptfoo', 'Run tests only against authorized targets and control provider credentials, request cost, test data, generated outputs, and CI exposure.']
]);

const geminiText = fs.readFileSync(path.resolve('gemini_links_research.md'), 'utf8');
const openaiText = fs.readFileSync(path.resolve('openai_links_research.md'), 'utf8');
const sources = rows.map(([name, url, category]) => {
  const inGemini = geminiText.toLowerCase().includes(name.toLowerCase()) || (name === 'CISA Known Exploited Vulnerabilities Catalog' && geminiText.includes('Known Exploited Vulnerabilities'));
  const inOpenAI = openaiText.toLowerCase().includes(name.toLowerCase()) || (name === 'OASIS Open CTI Documentation' && openaiText.includes('OASIS'));
  const kind = sourceKindByName.get(name);
  const score = ['government', 'standards-body'].includes(kind)
    ? 95
    : ['nonprofit-technical', 'open-source-project', 'academic'].includes(kind)
      ? 90
      : 82;
  return {
    id: slug(name), name, url, category,
    // Every registry row was selected from a name or abbreviated name in the
    // OpenAI summary; exact text matching is retained only as an audit aid.
    provenance: [inGemini && 'gemini', (inOpenAI || !inGemini) && 'openai'].filter(Boolean),
    source_kind: kind,
    access: name === 'Google Threat Intelligence' ? 'paid' : ['TryHackMe','LetsDefend','PentesterLab','Hack The Box Academy','VirusTotal','Binary Ninja','CyberDefenders','PingCastle','CodeQL','Semgrep','Prowler','BloodHound','Promptfoo','OpenCTI'].includes(name) ? 'freemium' : 'free',
    quality: {
      score,
      tier: score >= 90 ? 'A' : 'B',
      rationale: kind === 'commercial-technical'
        ? 'Useful first-party technical material; validate vendor claims against independent evidence.'
        : kind === 'academic'
          ? 'High research value; preprints must not be treated as peer reviewed by default.'
          : kind === 'open-source-project'
            ? 'Official open-source project material with direct operational or educational value.'
            : 'Canonical material from the named government, standards, nonprofit, open-core, independent, or mixed-license source.'
    },
    caution: safetyCautions.get(name) || (safety.has(name) ? 'May involve live malware, offensive techniques, or dual-use tooling; use only in an authorized isolated environment.' : null),
    validation: validationById.get(slug(name)) || {
      checked_on: checkedOn,
      method: 'automated HTTP check plus source-authority review',
      status: 'pending'
    }
  };
});

const unique = new Map();
for (const source of sources) {
  const key = new URL(source.url).href.replace(/\/$/, '').toLowerCase();
  if (!unique.has(key)) unique.set(key, source);
}

const assessmentFiles = [
  'data/knowledge-source-assessments-foundations.json',
  'data/knowledge-source-assessments-operations.json',
  'data/knowledge-source-assessments-app-cloud.json'
];
const controlledTags = new Set('cti threat-research threat-reports mitre-attack detection-engineering sigma yara suricata dfir incident-response malware-analysis reverse-engineering vulnerability-management vulnerability-research exploit-development penetration-testing red-team blue-team soc network-security cloud-security application-security api-security web-security active-directory identity-security mobile-security kubernetes container-security ai-security llm-security security-architecture standards government csirt academic tools datasets feeds repositories training labs books video community beginner intermediate advanced free paid freemium'.split(' '));
const repositoryHosts = new Set(['github.com', 'codeql.github.com']);
const categoryTags = {
  academic: ['academic', 'threat-research', 'community'],
  'adversary-emulation': ['red-team', 'mitre-attack'],
  'ai-security': ['ai-security'],
  'api-security': ['api-security', 'application-security'],
  'application-security': ['application-security'],
  'cloud-security': ['cloud-security'],
  'container-security': ['container-security'],
  cti: ['cti'],
  datasets: ['datasets'],
  'detection-engineering': ['detection-engineering'],
  dfir: ['dfir', 'incident-response'],
  'exploit-development': ['exploit-development', 'tools'],
  framework: ['standards', 'security-architecture'],
  government: ['government'],
  'identity-security': ['identity-security'],
  'incident-response': ['incident-response'],
  kubernetes: ['kubernetes', 'container-security'],
  'malware-analysis': ['malware-analysis', 'tools'],
  'mobile-security': ['mobile-security', 'application-security'],
  'network-security': ['network-security', 'blue-team'],
  'penetration-testing': ['penetration-testing'],
  'reverse-engineering': ['reverse-engineering'],
  soc: ['soc', 'blue-team'],
  'threat-informed-defense': ['mitre-attack'],
  'threat-reports': ['threat-reports'],
  'threat-research': ['threat-research'],
  training: ['training'],
  vulnerability: ['vulnerability-management'],
  'web-security': ['web-security', 'application-security']
};
const controlledTagOverrides = new Map([
  ['MITRE ATLAS', ['threat-research', 'red-team']],
  ['FIRST EPSS', ['feeds']],
  ['OSS-Fuzz', ['tools']],
  ['Cloud Security Alliance Cloud Controls Matrix', ['security-architecture', 'standards']]
]);
const assessments = {};
for (const file of assessmentFiles) {
  if (!fs.existsSync(file)) continue;
  const fragment = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [id, assessment] of Object.entries(fragment)) {
    if (assessments[id]) throw new Error(`Duplicate assessment for ${id}`);
    assessments[id] = assessment;
  }
}

for (const source of unique.values()) {
  if (assessments[source.id]) {
    Object.assign(source, assessments[source.id]);
    const authority = { 'primary-authoritative': 5, 'peer-reviewed-primary': 5, 'primary-operational': 4.5, mixed: 4, 'secondary-corroborating': 3.5, preprint: 3.5 }[source.assessment.evidence_use];
    const originality = { 'primary-authoritative': 5, 'peer-reviewed-primary': 5, 'primary-operational': 5, mixed: 4, 'secondary-corroborating': 3, preprint: 4 }[source.assessment.evidence_use];
    const maintenance = { continuous: 5, active: 4.5, periodic: 4, unclear: 2.5 }[source.assessment.maintenance];
    const practicalValue = Math.min(5, 2.5 + source.assessment.best_for.length * 0.3 + source.audience.length * 0.12 + source.content_formats.length * 0.1);
    const transparency = {
      government: 5,
      'standards-body': 5,
      academic: 5,
      'nonprofit-technical': 4.5,
      'open-source-project': 5,
      'open-core': 4,
      'commercial-technical': 3.5,
      'independent-technical': 4,
      'mixed-license-tool': 4
    }[source.source_kind];
    if (!transparency) throw new Error(`Unknown source kind for scoring: ${source.source_kind}`);
    const score = Math.round((authority * 0.27 + originality * 0.2 + maintenance * 0.18 + practicalValue * 0.22 + transparency * 0.13) * 20);
    const tier = score >= 90 ? 'A' : score >= 80 ? 'B' : 'C';
    const strongestFeature = source.assessment.strengths[0].replace(/[.!?]+$/, '');
    const principalLimitation = source.assessment.limitations[0].replace(/[.!?]+$/, '');
    source.quality = {
      score,
      tier,
      dimensions: { authority, originality, maintenance, practical_value: practicalValue, transparency },
      rationale: `${strongestFeature}; principal limitation: ${principalLimitation}.`
    };
    source.keywords = [...new Set(source.tags)];
    const normalized = new Set(categoryTags[source.category] || []);
    for (const tag of controlledTagOverrides.get(source.name) || []) normalized.add(tag);
    for (const tag of source.keywords) if (controlledTags.has(tag)) normalized.add(tag);
    if (controlledTags.has(source.access)) normalized.add(source.access);
    for (const level of source.skill_levels) normalized.add(level);
    if (source.source_kind === 'open-source-project') {
      normalized.add('tools');
      normalized.add('repositories');
      normalized.add('community');
    }
    if (source.source_kind === 'open-core') {
      normalized.add('tools');
      normalized.add('community');
    }
    if (source.source_kind === 'mixed-license-tool') normalized.add('tools');
    if (repositoryHosts.has(new URL(source.url).hostname.toLowerCase())) normalized.add('repositories');
    if (source.keywords.some(keyword => ['malware-samples', 'security-datasets', 'sample-catalog'].includes(keyword))) normalized.add('datasets');
    for (const format of source.content_formats) {
      const value = format.toLowerCase();
      if (/\blabs?\b/.test(value) || value.includes('challenge')) normalized.add('labs');
      if (/\bdatasets?\b/.test(value)) normalized.add('datasets');
      if (/\bfeeds?\b/.test(value)) normalized.add('feeds');
      if (/\bvideos?\b/.test(value)) normalized.add('video');
      if (/\bbooks?\b/.test(value)) normalized.add('books');
      if (/\brepositor(?:y|ies)\b/.test(value)) normalized.add('repositories');
    }
    source.tags = [...normalized].filter(tag => controlledTags.has(tag));
  }
}
if (assessmentFiles.every(file => fs.existsSync(file))) {
  const knownIds = new Set([...unique.values()].map(source => source.id));
  const unknown = Object.keys(assessments).filter(id => !knownIds.has(id));
  const missing = [...knownIds].filter(id => !assessments[id]);
  if (unknown.length) throw new Error(`Unknown assessment IDs: ${unknown.join(', ')}`);
  if (missing.length) throw new Error(`Missing assessments: ${missing.join(', ')}`);
}

const output = {
  schema_version: 1,
  generated_on: checkedOn,
  scope_note: 'Consolidates sources explicitly named in the two supplied research reports. The separate 130-record OpenAI artifacts referenced by the pasted summary were not supplied.',
  quality_scale: {
    A: '90-100: high-confidence, high-value source within its stated scope',
    B: '80-89: valuable source with material scope, access, evidence, or corroboration caveats',
    C: '70-79: specialist or discovery source requiring substantial corroboration',
    dimensions: {
      authority: 'Institutional or evidentiary authority for the claims it can support',
      originality: 'Amount of first-party standards, research, data, tooling, or instruction',
      maintenance: 'Observed update model from continuous through unclear',
      practical_value: 'Breadth of concrete, defensible use cases',
      transparency: 'Visibility into methods, code, data provenance, or governance'
    }
  },
  controlled_tag_vocabulary: [...controlledTags].sort(),
  assessment_files: assessmentFiles,
  sources: [...unique.values()]
};

const hasCompleteValidationSnapshot = validationById.size === output.sources.length
  && output.sources.every((source) => source.validation && source.validation.status !== 'pending');
if (hasCompleteValidationSnapshot) {
  output.validation_summary = Object.fromEntries(
    [...new Set(output.sources.map((source) => source.validation.status))]
      .sort()
      .map((status) => [status, output.sources.filter((source) => source.validation.status === status).length]),
  );
}

if (checkMode) {
  if (!existingDataset) throw new Error(`${outputPath} is missing.`);
  if (!hasCompleteValidationSnapshot) {
    throw new Error(`${outputPath} does not contain a complete frozen URL-validation snapshot.`);
  }
}

const serialized = `${JSON.stringify(output, null, 2)}\n`;
if (checkMode) {
  if (fs.readFileSync(outputPath, 'utf8') !== serialized) {
    throw new Error(`${outputPath} is stale relative to its registry and assessment inputs; run npm run refresh-knowledge-sources.`);
  }
  console.log(`Validated ${output.sources.length} unique sources against authored inputs and the frozen URL snapshot`);
} else {
  fs.writeFileSync(outputPath, serialized);
  console.log(`Wrote ${output.sources.length} unique sources`);
}
