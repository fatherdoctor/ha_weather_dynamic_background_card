# WDB1a checks (not part of the card)

Headless-Chromium checks used for `fix/sun-transforms` and `fix/frame-skip`. Each loads one build of
`ha-weather-dynamic-background-card.js` as a classic script and drives `SkyRenderer` directly. Paths to Playwright
and Chromium are the cloud session's; adjust them for another machine.

- `wdb_pos.mjs <dir>`: `<dir>/old.js` vs `<dir>/new.js`, transitions off: sun and rainbow centers per scene and
  viewport, plus a screenshot each. `pngdiff.mjs a.png b.png` compares the screenshots.
- `wdb_trans.mjs <build.js>`: transitions on; the sun and rainbow are midway after 3 s of 6 s and `left` stays 0.
- `wdb_fps.mjs <build.js>...`: loop() callbacks, drawn frames and rAF requests per second for 3 s of rain per
  quality, after five quick stop()/kick() pairs, and after stop().
