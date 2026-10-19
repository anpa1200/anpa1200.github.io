# Reproduce the ATT&CK catalog refresh

This is the existing local `ttp-simulation-lab` catalog generator, retained in the website repository so future updates do not depend on an untracked external directory. `config/` preserves the original taxonomy, planning overrides and curated tool/Sigma snapshots; ATT&CK changes do not imply those separately reviewed sources were refreshed or operationally validated. No imported procedures are executed.

The v20 input manifest pins official MITRE commit `20664a889568dce884a1dac0ec7b12ae3a199f51` (peeled v20.0 tag). Cache Enterprise, Mobile and ICS bundles as `enterprise.json`, `mobile.json`, `ics.json`, plus the unchanged pinned Atomic index, and create `manifest.json` using `ttp-simulation/data/catalog.json`'s `source_manifest`. Every byte hash is verified before generation. Keep older source snapshots for historical review. Python requires PyYAML.

From the website root, with CACHE pointing to that directory:

```sh
python3 scripts/ttp-catalog/tools/build_catalog.py "$CACHE"
python3 scripts/import-ttp-workbook-sources.py "$CACHE"
python3 scripts/import-interactive-matrix.py "$CACHE"
node scripts/import-ttp-actor-links.mjs "$CACHE/enterprise.json"
npm run build-ttp-integration
npm run build-interactive-matrix
```

The interactive import without an ATLAS argument preserves its separately pinned 2026.09 collection. After refresh run source-fidelity, workbook, matrix, browser and link checks. Retired IDs keep historical URLs and source content while leaving active indexes and search. The removed v20 mappings for DC0045/DC0119 remain in historical editorial definitions; unused definitions are allowed, but a newly required component without editorial content still blocks the build. ICS Embedded platforms use the existing ICS/OT project environment classification.
