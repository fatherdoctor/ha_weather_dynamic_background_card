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
