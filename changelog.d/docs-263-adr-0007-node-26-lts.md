### Changed

- ADR-0007 (`docs/adr/0007-node-runtime-pin-tracks-types-node.md`) records, in a dated update, that
  Node 26 entered LTS at v26.13.0 on 2026-10-28, so its "Current release" consequence no longer
  applies, and that every Node 26 release bundles npm 11: tightening the `devEngines` npm range to
  `12.x` now waits on `.nvmrc` moving to a Node major that bundles npm 12 (#215). The decision and
  its original text are unchanged, and no site behavior changes (#263).
