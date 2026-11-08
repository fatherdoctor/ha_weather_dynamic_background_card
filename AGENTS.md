# AGENTS.md

## What this is

A Home Assistant Lovelace card (HACS "dashboard" repository) that draws an animated weather background. One
dependency-free JavaScript file, loaded by the browser. Public, MIT.

## Commands

- Check: `node --check ha-weather-dynamic-background-card.js` - prints nothing and exits 0.
- Build: none; the file is served as written. Test: none; check changes by hand in Home Assistant, in light and dark
  mode and with Reduce motion on (needs a running Home Assistant and a person).
- CI: `.github/workflows/validate.yml` runs the HACS and syntax checks on every push.

## Layout

| Path | What is there |
|---|---|
| `ha-weather-dynamic-background-card.js` | the whole card; `VERSION` is near the top |
| `hacs.json` | HACS metadata (name, filename) |
| `CHANGELOG.md` | one section per release, newest first |
| `README.md`, `README.pl.md` | the user docs, English and Polish |
| `docs/images/` | README screenshots and animations |

## Rules

- Keep the card a single file with no dependencies, no build step and no external requests.
- Branch `builder/<slug>` from `main`; never commit to `main` directly.
- US English in code, comments, docs and commit messages (the Polish README is the one exception).
- A commit ends with `Co-Authored-By: Claude <model> <noreply@anthropic.com>` and nothing else from Claude.
- No session link, `Claude-Session:` line or claude.ai/code URL in a commit message or PR body.
- A PR body is short: the behavior change, the validation run, decisions needed.
- A user-visible change updates `README.md` and `CHANGELOG.md` in the same commit; keep `README.pl.md` in step.
- Public code gets the other-model adversarial review before a release; findings are fixed or declined in writing.
- Screenshots are never faked; list the ones needed in `screenshots/NEEDED.md` for the owner to capture.

## Release

1. Set `VERSION` in `ha-weather-dynamic-background-card.js` and add the section to `CHANGELOG.md`.
2. Run the check above and let `validate.yml` pass on `main`.
3. The owner tags `vX.Y.Z` and publishes the release; no workflow does it.

## Do not touch

- `LICENSE` - the owner's choice of license.
- Released tags - never move or delete one.
- `.github/workflows/` - a cloud session token cannot push it; describe the change in the PR for the owner to apply.

## Read more

- `README.md` - what the card does and how a person installs it.
- `CONTRIBUTING.md` - what the project asks of outside contributors.
- `CHANGELOG.md` - what changed in each release.
