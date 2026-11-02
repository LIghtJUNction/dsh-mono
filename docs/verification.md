# Local verification

Verified on 2026-11-02 against DeepSeek Harness `0.2.1-rc.2`. Both Node `24.22.1` and `26.13.0` passed source/test type checking, behavior tests and builds for all ten plugins. No live model credentials or paid provider calls were used.

| Plugin | Behavior tests | Result |
| --- | ---: | --- |
| dsh-caffeinate | 3 | PASS |
| dsh-compass | 4 | PASS |
| dsh-dotenv | 6 | PASS |
| dsh-file-context | 5 | PASS |
| dsh-hashline | 4 | PASS |
| dsh-notes | 6 | PASS |
| dsh-recall | 5 | PASS |
| dsh-red-green | 5 | PASS |
| dsh-rewind | 2 | PASS |
| dsh-rtk-optimizer | 3 | PASS |
| **Total** | **43** | **PASS** |

## Package and host acceptance

- Each of the ten built archives was installed in its own fresh temporary npm project and activated in the real published DSH host, with tools registered (dotenv intentionally registers no tool).
- All ten archives were then installed together in another fresh npm project. All plugins became ACTIVE; an offline model performed an actual model → hashline_read → model round trip.
- An isolated `DSH_HOME` installed all ten archives through `dsh plugin --profile headless add`. DSH composed every bundle in `--dump-config`, and the headless app booted successfully with `--help`. This acceptance leaves the user's real profiles unchanged.
- The scaffold generated an independent npm lock, rejected an existing destination, and preserved the root lock.
- All eleven release workflows parsed successfully and use only version tags or manual dispatch with an explicit tag. CI itself and public package releases have not been run.

## Reproduce

```sh
npm ci --ignore-scripts
npm run check
npm run pack
npm run test:cli
```

`test:cli` requires a locally installed dsh 0.2.1-rc.2. The other checks use published DSH runtime packages and an offline scripted model. Test processes, isolated installs and temporary profiles are removed after validation. Useful development dependencies, built outputs, local installable archives and check logs remain in the working copy.

Machine-readable archive names and SHA-256 values for this verification are in [packages.json](packages.json). Local runtime logs are under ignored `.artifacts/`. Installation and migration limits are in [migration.md](migration.md).
