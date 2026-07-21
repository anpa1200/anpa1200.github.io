# Adoption and outcome evidence

`data/adoption-evidence.json` is the controlled publication inventory. Its
schema is `data/adoption-evidence.schema.json`.

The public site may display an entry only when it is verified, marked
`published`, and either supported by an independently public record or by
explicit publication permission. A merged upstream contribution demonstrates
acceptance by that upstream project; it does not prove deployment, active use,
or a production outcome.

Run:

```bash
npm run check-adoption
```

Unverified submissions remain private or under review. Never store customer
telemetry, malware, internal reports, credentials, personal data, or other
confidential evidence in this repository or in the public issue form.
