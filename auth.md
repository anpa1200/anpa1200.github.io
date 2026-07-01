# Agent Authentication Policy for 1200km.com

1200km.com currently exposes only public documentation, portfolio pages, project descriptions, and public research material.

No public authenticated agent API is currently available.

Agents may access public pages according to:

- `/robots.txt`
- `/llms.txt`
- `/agent-index.md`
- `/.well-known/api-catalog`
- `/.well-known/mcp/server-card.json`
- `/.well-known/agent-skills/index.json`

Restricted actions are not available to public agents, including:

- Uploading CTI reports
- Uploading malware samples
- Running attack simulations
- Forwarding telemetry
- Querying private IOC data
- Accessing private SIEM integrations
- Performing authenticated AdversaryGraph workflows
- Executing offensive security techniques

For collaboration or access requests, use the public contact methods listed on 1200km.com.
