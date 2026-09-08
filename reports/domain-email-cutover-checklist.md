# Domain email cutover checklist

The site currently governs `1200km@gmail.com` through
`data/site-facts.json`. Do not publish `contact@1200km.com` until the address
accepts mail and replies have been tested.

## Provision and verify

- [ ] Choose a receiving provider or forwarding service for `1200km.com`.
- [ ] Add and verify the destination mailbox without committing tokens or provider credentials.
- [ ] Create the `contact@1200km.com` route and required MX records.
- [ ] Send test messages from at least two unrelated providers and confirm delivery, spam placement, and reply handling.
- [ ] If mail will be sent as `contact@1200km.com`, configure a real outbound provider plus SPF, DKIM, and DMARC. Forwarding alone does not authenticate outbound mail.
- [ ] Confirm the domain has no conflicting MX records and that SPF contains no more than one policy record.

## Site cutover

- [ ] Change only `contact.public_email.value` in `data/site-facts.json` after delivery is verified.
- [ ] Run the normal metadata, AI-discovery, structured-data, and release builds so every visible link and schema address is regenerated from that fact.
- [ ] Search the deployable artifact for the old address and retain it only where historical provenance requires it.
- [ ] Deploy, test the homepage/About/CV mail links without JavaScript, and verify the production structured-data graph.

This checklist intentionally does not prescribe a provider. Provider selection,
DNS mutation, destination verification, and outbound-mail authentication require
account access outside this repository.
