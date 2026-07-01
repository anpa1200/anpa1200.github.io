# Auth.md for 1200km.com

## Agent Authentication Policy

1200km.com currently exposes only public documentation, portfolio pages, project descriptions, and public research material.

No public authenticated agent API is currently available. Agents do not need to register to read public pages.

Agents may access public pages according to:

- `/robots.txt`
- `/llms.txt`
- `/agent-index.md`
- `/.well-known/api-catalog`
- `/.well-known/oauth-authorization-server`
- `/.well-known/oauth-protected-resource`
- `/.well-known/mcp/server-card.json`
- `/.well-known/agent-skills/index.json`

## Agent Registration

Public agent registration is not currently supported because there are no public protected APIs on 1200km.com.

For collaboration, API access discussion, or private AdversaryGraph deployment evaluation, use the public contact methods listed on 1200km.com.

## OAuth Discovery

The site publishes honest discovery metadata:

- `/.well-known/oauth-authorization-server` documents that no public authorization endpoint is available.
- `/.well-known/oauth-protected-resource` documents that the public website has no protected API scopes.

Restricted actions are not available to public agents, including:

- Uploading CTI reports
- Uploading malware samples
- Running attack simulations
- Forwarding telemetry
- Querying private IOC data
- Accessing private SIEM integrations
- Performing authenticated AdversaryGraph workflows
- Executing offensive security techniques

## Safety Boundary

Offensive-security, malware-analysis, adversary-simulation, and detection-validation content is for authorized defensive research, controlled lab validation, professional security education, and lawful use only.
