// @ts-check
// Canonical public configuration for the ITDR Docusaurus snapshot.
const config = {
  title: 'ITDR – Identity Threat Detection & Response',
  tagline: 'Protocols, attack techniques, detection engineering, and simulations for identity-centric security.',
  favicon: 'img/logo.png',
  url: 'https://1200km.com',
  baseUrl: '/ITDR/',
  scripts: [{ src: 'https://1200km.com/assets/docusaurus-ecosystem.js?v=20260721-shell', defer: true }],
  organizationName: 'anpa1200',
  projectName: 'anpa1200.github.io',

  trailingSlash: true,
  onBrokenLinks: 'throw',
  markdown: { hooks: { onBrokenMarkdownLinks: 'warn' } },
  i18n: { defaultLocale: 'en', locales: ['en'] },

  presets: [
    [
      'classic',
      {
        docs: { sidebarPath: './sidebars.js' },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      },
    ],
  ],

  themeConfig: {
    image: 'img/logo.png',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    metadata: [{
      name: 'keywords',
      content: 'identity threat detection, ITDR, identity security, Entra ID, Active Directory, LAPS, MFA, privileged access, credential theft, lateral movement, identity attacks, detection engineering, UEBA, zero trust',
    }],
    navbar: {
      title: 'ITDR',
      logo: {
        alt: '1200km',
        src: 'img/logo.png',
      },
      items: [
        { type: 'docSidebar', sidebarId: 'itdrSidebar', position: 'left', label: 'Manual' },
        { to: '/docs/intro', label: 'Start Here', position: 'left' },
        {
          label: 'Projects',
          position: 'right',
          items: [
            { label: 'CTI Analyst Field Manual', href: 'https://1200km.com/cti-analyst-field-manual/' },
            { label: 'CTI as a Code', href: 'https://1200km.com/CTI_as_a_Code/' },
            { label: 'Operation Desert Hydra', href: 'https://1200km.com/operation-desert-hydra/' },
            { label: 'Customer-Driven AI CTI', href: 'https://1200km.com/customer-driven-ai-cti-project/' },
            { label: 'Israel Threat Actors CTI', href: 'https://1200km.com/israel-government-threat-actors-cti/' },
            { label: 'AI vs Defense', href: 'https://1200km.com/ai-vs-defense/' },
          ],
        },
        { href: 'https://medium.com/@1200km', label: 'Medium', position: 'right' },
        {
          href: 'https://github.com/anpa1200/anpa1200.github.io/tree/main/ITDR',
          label: 'Site source',
          position: 'right',
        },
        {
          href: 'https://1200km.com/',
          label: '1200km Research',
          position: 'right',
          className: 'navbar-portfolio-btn',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Foundations',
          items: [
            { label: 'What is Identity?', to: '/docs/identity-foundations/what-is-identity' },
            { label: 'What is ITDR?', to: '/docs/identity-foundations/what-is-itdr' },
            { label: 'Identity Attack Surface', to: '/docs/identity-foundations/identity-attack-surface' },
          ],
        },
        {
          title: 'Protocols',
          items: [
            { label: 'Active Directory', to: '/docs/protocols/active-directory/ad-overview' },
            { label: 'Entra ID', to: '/docs/protocols/entra-id/entra-overview' },
            { label: 'PKI & Certificates', to: '/docs/protocols/pki-certificates/pki-overview' },
          ],
        },
        {
          title: 'Detection',
          items: [
            { label: 'Detection Framework', to: '/docs/detection/detection-framework' },
            { label: 'AD Attack Detection', to: '/docs/detection/ad-attack-detection/detect-kerberoasting' },
            { label: 'Cloud Attack Detection', to: '/docs/detection/cloud-attack-detection/detect-device-code-phishing' },
          ],
        },
        {
          title: 'Author',
          items: [
            { label: 'Medium', href: 'https://medium.com/@1200km' },
            { label: 'GitHub', href: 'https://github.com/anpa1200' },
            { label: 'LinkedIn', href: 'https://www.linkedin.com/in/andrey-pautov/' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Andrey Pautov. Defensive ITDR handbook.`,
    },
    prism: {
      theme: require('prism-react-renderer').themes.github,
      darkTheme: require('prism-react-renderer').themes.dracula,
      additionalLanguages: ['powershell', 'bash', 'yaml', 'kusto', 'python'],
    },
  },
};

module.exports = config;
