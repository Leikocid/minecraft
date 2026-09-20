# BDS check fixtures

Each directory here is an **overlay** on top of the real built add-on, not a
whole pack. `scripts/bds-check.mjs --overlay <dir>` unpacks
`dist/andrew.mcaddon` and copies the overlay over it, so the server loads a
genuine add-on with exactly one thing wrong.

## broken-dependency

`behavior/manifest.json` with the `@minecraft/server` dependency set to
`9.9.9`, a version no engine provides. Everything else matches the real
manifest.

Used to prove `bds:check` can go red:

```sh
npm run bds:check -- --overlay tests/fixtures/bds/broken-dependency
```

The run must exit non-zero and quote the server's own error. A check that only
ever passes proves nothing — this is the negative control.

Keep the header/module uuids in step with `packs/behavior/manifest.json`; only
the dependency version is meant to differ.
