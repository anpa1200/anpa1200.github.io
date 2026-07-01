(function () {
  const safetyBoundary =
    'Public read-only discovery only. Offensive-security, malware-analysis, adversary-simulation, and detection-validation content is for authorized defensive research, controlled lab validation, professional education, and lawful use.';

  const publicLinks = [
    { title: 'Homepage', url: 'https://1200km.com/' },
    { title: 'Projects', url: 'https://1200km.com/projects.html' },
    { title: 'AdversaryGraph', url: 'https://1200km.com/adversarygraph/' },
    { title: 'AdversaryGraph Docs', url: 'https://1200km.com/adversarygraph-docs/' },
    { title: 'AdversaryGraph Capabilities', url: 'https://1200km.com/adversarygraph-docs/capabilities/' },
    { title: 'Threat Matrix', url: 'https://1200km.com/threat-matrix/' },
    { title: 'Agent Index', url: 'https://1200km.com/agent-index.md' },
    { title: 'Auth Policy', url: 'https://1200km.com/auth.md' },
  ];

  const tools = [
    {
      name: 'get_site_summary',
      description: 'Return a read-only summary of 1200km.com and its public cybersecurity research focus.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {},
      },
      execute: async () => ({
        site: '1200km.com',
        owner: 'Andrey Pautov',
        summary:
          'Cybersecurity portfolio, research hub, documentation site, and project hub focused on CTI-to-detection, detection engineering, ATT&CK mapping, malware-analysis workflows, SIEM validation, and AI-assisted analyst tooling.',
        flagship_project: 'AdversaryGraph',
        safety_boundary: safetyBoundary,
      }),
    },
    {
      name: 'get_adversarygraph_summary',
      description: 'Return a read-only summary of AdversaryGraph public documentation and capabilities.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {},
      },
      execute: async () => ({
        name: 'AdversaryGraph',
        summary:
          'Self-hosted CTI-to-detection workbench for CTI report analysis, IOC investigation, ATT&CK mapping, malware-analysis evidence, detection-gap review, attack simulation documentation, SIEM validation documentation, and analyst reporting.',
        docs: 'https://1200km.com/adversarygraph-docs/',
        repository: 'https://github.com/anpa1200/adversarygraph',
        restricted_public_actions: [
          'malware upload',
          'attack simulation execution',
          'SIEM forwarding',
          'private IOC queries',
          'authenticated platform workflows',
        ],
        safety_boundary: safetyBoundary,
      }),
    },
    {
      name: 'list_public_project_links',
      description: 'List public 1200km and AdversaryGraph pages suitable for read-only agent retrieval.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {},
      },
      execute: async () => ({ links: publicLinks }),
    },
    {
      name: 'get_agent_auth_policy',
      description: 'Return the public agent authentication policy for 1200km.com.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {},
      },
      execute: async () => ({
        auth_required_for_public_pages: false,
        registration_available: false,
        auth_policy: 'https://1200km.com/auth.md',
        oauth_authorization_server: 'https://1200km.com/.well-known/oauth-authorization-server',
        oauth_protected_resource: 'https://1200km.com/.well-known/oauth-protected-resource',
      }),
    },
  ];

  function provideWebMcpTools() {
    const modelContext = navigator.modelContext;
    if (!modelContext || typeof modelContext.provideContext !== 'function') return;
    try {
      modelContext.provideContext({
        name: '1200km public read-only context',
        description: 'Read-only public discovery tools for 1200km.com.',
        tools,
      });
    } catch (error) {
      console.debug('WebMCP read-only context was not registered:', error);
    }
  }

  if ('modelContext' in navigator) {
    provideWebMcpTools();
  }
})();
