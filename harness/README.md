# WDB1a and WDB1b checks (not part of the card)

Headless-Chromium checks used for `fix/sun-transforms` and `fix/frame-skip`. Each loads one build of
`ha-weather-dynamic-background-card.js` as a classic script and drives `SkyRenderer` directly. Paths to Playwright
and Chromium are the cloud session's; adjust them for another machine.

- `wdb_pos.mjs <dir>`: `<dir>/old.js` vs `<dir>/new.js`, transitions off: sun and rainbow centers per scene and
  viewport, plus a screenshot each. `pngdiff.mjs a.png b.png` compares the screenshots.
- `wdb_trans.mjs <build.js>`: transitions on; the sun and rainbow are midway after 3 s of 6 s and `left` stays 0.
- `wdb_fps.mjs <build.js>...`: loop() callbacks, drawn frames and rAF requests per second for 3 s of rain per
  quality, after five quick stop()/kick() pairs, and after stop().

WDB1b checks, for `fix/neutral-sky` and `fix/version-guard`:

- `neutral.mjs <build.js>...`: drives the page's `manager` with fake `hass` objects: first load with the weather
  entity unavailable, unknown and missing, preview overrides, recovery to `cloudy`, a later outage; prints the
  scene fields and the console warnings.
- `render.mjs <build.js> <outdir>`: renders the neutral scene at day, dusk and night with `SkyRenderer`, screenshots
  each, and prints page errors.
- `twocopies.mjs <a.js,b.js>...`: loads the builds in order on one page, each in its own block scope as module
  resources are, and prints the warnings, the running manager's version and the `customCards` count.

WDB1br review checks (fable, 2026-10-22):

- `dupload.mjs <a.js> <b.js>`: loads the two builds in order as classic scripts (a YAML resource of `type: js`) and
  again as real `type="module"` scripts; prints warnings, page errors, the running manager's version, whether the
  element is defined and the `customCards` count.
- `neutral_static.mjs <build.js> <outdir>`: the neutral scene with animations off (`drawStatic`) plus frost, smog
  and the warning glow; prints the scene fields and page errors, screenshots it.

WDB1c checks, for `fix/persist-memory` and `fix/pause-entity`:

- `persist.mjs <build.js>...`: drives `manager` across simulated reloads (a new page on one origin, so localStorage
  carries over) with a controlled `Date.now`: rain then a reload keeps the rain and the rainbow; a pending change
  keeps its start time across a reload; a record older than the delay, from another entity, malformed or
  future-dated is not restored; `hysteresis: 0` keeps only the last rain; 100 refreshes over two minutes write
  twice; nothing is written before `hass`; on the patches build, an outage at load keeps a fresh remembered sky and
  goes neutral once the entity's last report is older than the delay.
- `pause.mjs <build.js>...`: mounts the layer through `manager` and counts drawn frames per 1.5 s while a fake
  screensaver switch is off, on (also after hass updates, refresh and a direct `kick()`), unavailable or missing,
  without `pause_entity`, and across a remount while on; then `battery_saver` with a stubbed `navigator.getBattery()`
  (discharging, charger connected and removed, device quality High) and with no Battery API; and checks both
  options are in the editor form with labels.

WDB1c.f checks (opus, 2026-10-28), from the WDB1cr review's probe scenarios; each prints PASS/FAIL per check and
exits non-zero on a failure:

- `persist-extra.mjs <build.js>...`: P1 the real element set up as Lovelace does (append, `setConfig`, then `hass`)
  reads and writes no weather memory before `hass` and keeps a pending change's start across the reload; P2 the
  record's `seen` is the entity's `last_updated`, not the time of refreshes, so an outage reload does not restore an
  old sky; P3 100 alternating updates at one instant and an unchanged state across a minute boundary write nothing
  more; changes 59.90 s and 59.95 s after a write are not written at once, and the real timer alone (no refresh)
  writes once, the newest; a held change that goes back to the saved record cancels the write; returning to an
  unchanged entity and reloading 100 ms later write nothing, and a reload 30 s after a write holds a change to the
  minute (WDB1c.f2 FC1, FC2); P4 an unknown condition, a future-dated timestamp or write time, a non-object and a
  pending change without a shown one each make the whole record ignored, and a valid recent `lastWet` in an invalid
  record restores no rainbow.
- `pause-extra.mjs <build.js>...`: A1 five immediate screensaver on/off pairs leave one animation chain, and none
  after the pause; A2 while paused no loop callbacks, no running CSS animations (fog, warning glow), no cloud
  generation, no sky fade on a scene change, and a quality change plus a window resize keep the drawn pixels; on
  resume the waiting quality and scene apply and the animations and loop run again. Pausing clears the queued
  cloud-generation step at once (WDB1c.f2 FC3), and generation goes on after the resume.
- `persist.mjs` now gives states a `last_updated` (the step's `lu` minute, else the clock), as Home Assistant does.
