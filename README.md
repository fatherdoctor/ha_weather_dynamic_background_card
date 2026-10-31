# HA Weather Dynamic Background

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://hacs.xyz/docs/faq/custom_repositories/)
[![Release](https://img.shields.io/github/v/release/michaldyr/ha-weather-dynamic-background-card)](https://github.com/michaldyr/ha-weather-dynamic-background-card/releases)

🇬🇧 English · [🇵🇱 Polski](README.pl.md)

A living background for your Home Assistant dashboard. The sky behind your cards follows the real weather, the position of the sun and the phase of the moon.

It is a Lovelace card that is invisible on the dashboard. Add it to a view and it paints an animated sky behind all the other cards: a soft cloud deck that drifts with the wind, slanted rain with drops running down the glass, snow, thunderstorms with lightning, fog, stars, the moon, shooting stars, a rainbow after the rain, frost below freezing, smog and even the aurora.

<p align="center">
  <img src="docs/images/anim-rain.gif" width="190" alt="Rain with drops on the glass">
  <img src="docs/images/anim-storm.gif" width="190" alt="Thunderstorm at night">
  <img src="docs/images/anim-snow.gif" width="190" alt="Snowfall">
  <img src="docs/images/anim-night.gif" width="190" alt="Clear night with stars and the moon">
</p>

| Sunny, light theme | Rain, dark theme |
|---|---|
| ![Sunny day](docs/images/desktop-sunny-light.jpg) | ![Rain](docs/images/desktop-rain-dark.jpg) |
| **Golden hour** | **Clear night** |
| ![Golden hour](docs/images/desktop-golden-light.jpg) | ![Night](docs/images/desktop-night-dark.jpg) |

> The screenshots and animations were made on a test page that imitates the default Home Assistant cards and feeds the card simulated weather data. They are not screenshots of a real Home Assistant instance.

---

## Contents

- [Features](#features)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Per-device settings and the preview panel](#per-device-settings-and-the-preview-panel)
- [How the sky is computed](#how-the-sky-is-computed)
- [Effects gallery](#effects-gallery)
- [Making your cards translucent (optional)](#making-your-cards-translucent-optional)
- [CSS variables for themes](#css-variables-for-themes)
- [Accessibility and performance](#accessibility-and-performance)
- [Troubleshooting](#troubleshooting)
- [Limitations](#limitations)
- [Similar projects](#similar-projects)

## Features

- **Real sky colours.** The gradient follows the sun's elevation continuously: night, blue hour, dawn, golden hour, day. The sun's glow moves from east to west with its azimuth.
- **All Home Assistant weather states.** Sunny, partly cloudy, cloudy, fog, rain, pouring, thunderstorm, snow, sleet, hail, windy and exceptional.
- **Realistic clouds.** A soft, mottled cloud deck hangs at the top of the sky and thins out downwards. It is generated procedurally from noise, not drawn as shapes. Two layers drift with the wind at different speeds. More cloud cover makes the deck denser and lets it reach lower. The clouds are white on a blue sky, grey when overcast, dark in rain and blue-grey at night. They glow warm at golden hour, light up with lightning and hide the moon.
- **Rain on the glass.** In rain, drops land on the "glass" in front of the sky; the larger ones run down and leave small droplets behind.
- **Depth.** Rain falls in three depth layers, and snow has large out-of-focus flakes right in front of the "camera".
- **Driven by your data.** Cloud coverage sets the density and reach of the cloud deck. Wind speed and bearing set the slant of the rain, the drift of the snow and the speed of the clouds. Visibility adds haze, and an optional precipitation sensor sets the density of rain.
- **Night sky.** Twinkling stars, occasional shooting stars and the moon in its real phase, computed astronomically so no Moon integration is needed. The moon fades gradually behind thickening cloud.
- **Optional extras.**
  - A rainbow after rain when the sun is low.
  - Frost on the screen edges below 0 °C.
  - Smog from a PM2.5 sensor.
  - Aurora only during real geomagnetic storms that are strong enough for your latitude.
  - A coloured glow for weather warnings.
- **Works with light and dark themes.** The sky shows reality, and the theme only corrects it: bright skies are dimmed in a dark theme and dark skies are lifted in a light theme.
- **Calm scene changes.** A new weather state has to last a set time (10 minutes by default) before the scene changes, and then it cross-fades.
- **Per-device settings.** A wall tablet and a phone can have different animation and quality settings.
- **Accessible.** Respects *Reduce motion* and *Reduce transparency*, and pauses when the tab is hidden.
- **One JavaScript file, no dependencies.** English and Polish UI.

## Installation

The card is installed with [HACS](https://hacs.xyz) as a custom repository.

1. Open **HACS**, then **⋮ → Custom repositories**.
2. Enter `https://github.com/michaldyr/ha-weather-dynamic-background-card`, choose the type **Dashboard** and click **Add**.
3. Find **HA Weather Dynamic Background** in HACS and download it.
4. Reload the browser. In the companion app, reset the frontend cache in the app's debugging or troubleshooting settings.

HACS stores the card in `/config/www/community/ha-weather-dynamic-background-card/` and serves it as `/hacsfiles/ha-weather-dynamic-background-card/ha-weather-dynamic-background-card.js`. With dashboards in the default (UI) mode, HACS adds this resource for you. If your dashboards are in YAML mode, add it yourself as a resource of type `module`.

Updates arrive through HACS as well.

## Quick start

Add the card to every view that should have the sky. It does not matter where; the end of the view is the most convenient place.

```yaml
type: custom:ha-weather-dynamic-background-card
weather_entity: weather.forecast_home
```

The card takes no space on the dashboard. In edit mode it shows a settings panel with a live scene preview. In the card picker it is listed as **HA Weather Dynamic Background**.

## Configuration

Everything can be set in the visual editor. These are the YAML options:

| Option | Default | Description |
|---|---|---|
| `weather_entity` | — | **Required.** Your `weather.*` entity. |
| `sun_entity` | `sun.sun` | Sun entity (elevation and azimuth). |
| `precipitation_entity` | — | Optional sensor with the current precipitation rate in mm/h; it sets the rain density. |
| `pm25_entity` | — | Optional PM2.5 sensor (µg/m³) for smog. |
| `kp_entity` | — | Optional sensor with the planetary Kp index for the aurora. |
| `warning_entity` | — | Optional weather warning entity (e.g. Meteoalarm), see [Effects](#effects-gallery). |
| `animations` | `true` | Animate rain, snow, clouds, stars and lightning. |
| `intensity` | `100` | Precipitation density, 20–200 %. |
| `hysteresis` | `10` | Minutes a new weather state must last before the scene changes. Use `0` for instant changes. |
| `dark_dim` | `40` | How much bright skies are dimmed in a dark theme, %. |
| `light_lift` | `10` | How much dark skies are lifted in a light theme, %. |
| `lightning_flash` | `true` | Sky flashes during thunderstorms. These are always off when *Reduce motion* is on. |
| `show_moon` | `true` | Show the moon. |
| `show_stars` | `true` | Show stars. |
| `show_shooting_stars` | `true` | Occasional shooting stars on clear nights. |
| `sun_azimuth` | `true` | Move the sun's glow with its azimuth. |
| `show_rainbow` | `true` | Rainbow after rain. |
| `show_frost` | `true` | Frost on the edges below 0 °C. |
| `show_panel` | `false` | Keep the settings and preview panel visible outside edit mode, which is handy while testing. |

Full example:

```yaml
type: custom:ha-weather-dynamic-background-card
weather_entity: weather.forecast_home
precipitation_entity: sensor.rain_rate
pm25_entity: sensor.outdoor_pm2_5
kp_entity: sensor.planetary_k_index
warning_entity: binary_sensor.meteoalarm
intensity: 120
hysteresis: 15
dark_dim: 45
```

The entity names in this example are placeholders; use your own.

## Per-device settings and the preview panel

<img src="docs/images/phone-panel.jpg" width="260" align="right" alt="Settings panel">

In edit mode, or with `show_panel: true`, the card shows a panel.

**On this device.** These settings are stored in the browser, so each device has its own:

- **Background on**: turns the background off on this device only.
- **Animations**:
  - *Automatic* follows the system *Reduce motion* setting.
  - *Always* animates even when *Reduce motion* is on.
  - *Off* shows a still scene.
- **Quality**:
  - *Automatic* lowers the particle count when the device struggles.
  - *Power saving* is meant for older tablets.
  - *High* runs at 60 fps and full resolution.

**Scene preview.** You can force any weather state, effect and sun elevation to see every scene without waiting for the weather. The preview lasts until the page is reloaded.

The header line shows what the card currently reads: the state, sun elevation, cloud coverage, wind, moon illumination and any pending scene change.

<br clear="right">

## How the sky is computed

| Input | Source | Effect |
|---|---|---|
| Sun elevation | `sun.sun` → `elevation` | Sky gradient: night → blue hour → dawn → golden hour → day, blended continuously. |
| Sun azimuth | `sun.sun` → `azimuth` | The glow sits left in the morning, centred at noon and right in the evening, and lower when the sun is low. |
| Weather state | `weather.*` state | The scene: palette, clouds, precipitation, lightning, fog. |
| Cloud coverage | `cloud_coverage` attribute | Number, density and tone of clouds; how much the sky is muted; how much of the moon shows through. |
| Wind | `wind_speed`, `wind_bearing` | Rain slant, snow drift, cloud speed and direction. |
| Visibility | `visibility` attribute | Haze. |
| Temperature | `temperature` attribute | Frost below 0 °C, densest at about −6 °C. |
| Moon phase | computed | Shape and brightness of the moon; mirrored in the southern hemisphere. |
| Recent rain | weather history in the browser | Rainbow for up to 30 minutes after rain. |
| PM2.5 | `pm25_entity` | Smog from about 25 µg/m³, dense above about 130 µg/m³. |
| Kp index | `kp_entity` + your latitude | Aurora only when Kp is high enough for your latitude (roughly Kp 7–8 in central Europe), at night and under a clear sky. |
| Warnings | `warning_entity` | Yellow, orange or red glow at the top of the screen. |
| Theme | Home Assistant light or dark mode | Dims or lifts the sky so cards stay readable. |

If your weather integration does not provide an attribute, the card uses sensible values for the current state. Met.no, the default integration, provides cloud coverage, wind and temperature.

**Weather warnings.** The card reads the level from the state or from the `awareness_level`, `level`, `severity` or `color` attributes. It understands `yellow`, `orange` and `red` (also in Polish), `moderate`, `severe` and `extreme`, and numbers from 1 to 3. Any other "on" state counts as level 1. This covers the core Meteoalarm integration and most other sources.

## Effects gallery

The sky alone, without a dashboard on top:

| Partly cloudy | Cloudy | Rain | Thunderstorm |
|---|---|---|---|
| ![](docs/images/sky-partlycloudy.jpg) | ![](docs/images/sky-cloudy.jpg) | ![](docs/images/sky-rain.jpg) | ![](docs/images/sky-storm.jpg) |
| **Snow** | **Fog** | **Golden hour** | **Clear night** |
| ![](docs/images/sky-snow.jpg) | ![](docs/images/sky-fog.jpg) | ![](docs/images/sky-golden.jpg) | ![](docs/images/sky-night.jpg) |
| **Rainbow** | **Frost** | **Smog** | **Aurora** |
| ![](docs/images/sky-rainbow.jpg) | ![](docs/images/sky-frost.jpg) | ![](docs/images/sky-smog.jpg) | ![](docs/images/sky-aurora.jpg) |

## Making your cards translucent (optional)

With Home Assistant's default theme the cards are opaque, so you see the sky between and around them, as in the screenshots above. If you want the sky to shine through the cards, use a theme with translucent, blurred cards. Home Assistant supports this natively through the `ha-card-background` and `ha-card-backdrop-filter` theme variables.

| Translucent cards, light | Translucent cards, dark |
|---|---|
| ![](docs/images/desktop-glass-light.jpg) | ![](docs/images/desktop-glass-dark.jpg) |

Add this to your `themes` folder, or merge the variables into your own theme:

```yaml
weather-glass:
  modes:
    light:
      ha-card-background: "rgba(255, 255, 255, calc(0.62 + var(--wbg-sky-dark, 0) * 0.25))"
      ha-card-backdrop-filter: "blur(18px) saturate(160%)"
      ha-card-border-color: "rgba(255, 255, 255, 0.55)"
    dark:
      ha-card-background: "rgba(28, 28, 28, calc(0.55 + var(--wbg-sky-light, 0) * 0.25))"
      ha-card-backdrop-filter: "blur(18px) saturate(160%)"
      ha-card-border-color: "rgba(255, 255, 255, 0.08)"
```

The `calc()` makes the cards more opaque when the sky behind them works against the theme, for example on a dark night sky in the light theme. Text then stays readable.

If a solid header bar hides the top of the sky, also set `app-header-background-color` to a translucent colour.

## CSS variables for themes

While the background is active, the card sets these variables on the page:

| Variable | Value |
|---|---|
| `--wbg-active` | `1` while the background is shown. |
| `--wbg-sky-dark` | From `0` (bright sky) to `1` (dark sky), after the theme correction. |
| `--wbg-sky-light` | `1 − --wbg-sky-dark`. |
| `--wbg-reduce-transparency` | `1` when the system asks for reduced transparency. |

You can use them in any theme or with card-mod.

## Accessibility and performance

- With the system **Reduce motion** setting on, the card shows a still scene with no lightning flashes. You can override this per device.
- **Reduce transparency** is passed to themes through `--wbg-reduce-transparency`.
- Animation stops when the browser tab or the app is in the background.
- Rain, snow and hail run at about 30 fps (60 fps on *High*). Clouds and stars run at about 20 fps. A sky with nothing to animate stops redrawing.
- The cloud textures are generated once, a few rows at a time between frames, so loading the dashboard never stalls. Clouds fade in when they are ready, usually within a second.
- In *Automatic* quality, the card measures its own frame cost and reduces the number of particles on slow devices.
- The background is a few canvases plus gradient layers. No images are downloaded.

## Troubleshooting

**"Custom element doesn't exist: ha-weather-dynamic-background-card"**
The browser has not loaded the file.
- In HACS, check that **HA Weather Dynamic Background** is downloaded.
- Open `http://<your-ha>:8123/hacsfiles/ha-weather-dynamic-background-card/ha-weather-dynamic-background-card.js`. You should see the code, not an error.
- In **Settings → Dashboards → ⋮ → Resources**, check that the resource above is listed with the type *JavaScript module*. Dashboards in YAML mode need it added by hand.
- Hard-reload the browser or reset the companion app's frontend cache.

**The card is there, but there is no background**
- Open the panel in edit mode. Warnings about a missing entity or the background being off on this device show there.
- Check the browser console (F12). It should contain `HA-WEATHER-DYNAMIC-BACKGROUND-CARD 1.6.0`.

**The sky is hidden behind a solid colour**
Your theme probably paints the view background or the header with a solid colour. See [Making your cards translucent](#making-your-cards-translucent-optional).

**It stutters on an old tablet**
Set *Quality → Power saving* or *Animations → Off* in the panel on that device.

**The scene changes too late or too often**
Adjust `hysteresis`. It is the number of minutes a new weather state must last.

## Limitations

- To sit behind the view, the card inserts its layer into the Home Assistant frontend structure, right after the view background. It was developed against the Home Assistant 2026.10 frontend. Older versions are untested, and a future frontend redesign may need an update of the card.
- The rainbow and the scene-change delay use weather history kept in the browser (`localStorage`, per weather entity). It survives a page reload, but not clearing the site data or switching to another browser or device. It is written only when it changed, and at most once a minute per weather entity, counted from the last write in that browser (the record carries its write time, so switching entities or reloading the page does not reset the minute). A change inside the minute is written when the minute is up, so a reload within a minute of a weather change can miss that change.
- The weather state comes from your integration. Many forecast services report the current state with a delay.
- The clouds sit at the top of the sky. With opaque default cards on a phone, much of them is hidden behind the first cards; translucent cards (below) show them best.
- It is a decorative card. Nothing in it is meant for safety decisions, warnings included.

## Similar projects

These are good projects with a different approach, since they animate the weather inside a card rather than behind the whole dashboard:

- [Nimbus Weather Card](https://github.com/maxfok/nimbus-weather-card)
- [Atmospheric Weather Card](https://community.home-assistant.io/t/atmospheric-weather-card/981048)
