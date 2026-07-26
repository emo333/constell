# constell

**Constell** is a self-contained, drop-in animated background component for any webpage.
It paints a living, ever-shifting night sky — dozens of stars drifting at different depths,
multi-toned nebula clouds swaying behind them, parallax shift that follows the cursor, and
the occasional shooting star streaking across — onto a canvas element positioned behind
your page content.

The component ships as a tiny, dependency-free pair of files placed beside your HTML:

- **`constell.js`** — an ES module that performs all of the rendering and animation, exposes a small
  `Constell` API (`init` / `configure`) and is documented in detail further down this README.
- **`constell.css`** — an optional stylesheet that provides sensible dark-mode defaults for the
  page's background gradient and overlay, plus a set of CSS custom properties you can override to
  retheme the look without touching any JavaScript.

There is no build step, no framework, no runtime dependency and no network request. Drop the two
files into a project, add a canvas element, and call `Constell.init()` — your static page becomes
a calm, animated, deep-space surface in a handful of lines.

<img width="2213" height="1182" alt="constell-ss" src="https://github.com/user-attachments/assets/c726914f-1587-4c27-b740-fa6c321642cf" />

```html
<!-- 1. Include CSS (optional; ships a pleasant default) -->
<link rel="stylesheet" href="constell.css" />

<!-- 2. Place a canvas element -->
<canvas id="scene"></canvas>

<!-- 3. Initialise with defaults or custom config -->
<script type="module">
  import { Constell } from "./constell.js";

  // Defaults only
  Constell.init("#scene");

  // Or with overrides
  Constell.init("#scene", {
    star: { count: 60, hueMin: 170, hueMax: 290 },
    motion: { frameMs: 33 },
    parallax: { sensitivityX: 0.0008 },
  });
</script>
```

You can also call `Constell.configure(overrides)` at any time to change settings after init — stars are re-seeded when `star.count` changes.

---

## How To Use In Your Web Page

Follow these steps to add the constellation background to one of your own pages. The whole process
takes only a few minutes and the result is a small handful of files plus a couple of lines of
HTML.

### 1. Copy the two files next to your HTML

Copy **`constell.js`** and **`constell.css`** into the same folder as the HTML page you want to
enhance (or anywhere convenient — just adjust the paths in the steps below). No other files,
bundlers or libraries are required.

### 2. Link the stylesheet

Add the stylesheet inside the `<head>` of your page:

```html
<link rel="stylesheet" href="constell.css" />
```

This gives you a dark body gradient, sets up basic full-viewport geometry, and exposes the
documented `--constell-*` theming variables. The stylesheet is **optional** — if you already
have your own background styles, feel free to skip this step.

### 3. Add a `<canvas>` element

Place a `<canvas>` somewhere in your `<body>`. Its `id` will be used to attach the animation:

```html
<canvas id="scene"></canvas>
```

When `constell.css` is loaded, that element is automatically positioned as a fixed,
full-viewport background layer behind your content (via the `#scene` rule). If you skipped
step 2, add the equivalent `position: fixed; inset: 0; width: 100%; height: 100%;` styles yourself
so the canvas sits behind everything else.

### 4. Initialise the animation

At the end of your page (or in your own JS module), import and call `Constell.init()`:

```html
<script type="module">
  import { Constell } from "./constell.js";

  // Defaults — 42 stars, nebulae, parallax, occasional shooting stars
  Constell.init("#scene");
</script>
```

You can pass either a CSS-selector string (such as `"#scene"`) **or** the canvas element itself.
With these four lines you already have a working animated background.

### 5. (Optional) Tweak the look and behaviour

Pass a config object as the second argument to override the defaults at startup:

```html
<script type="module">
  import { Constell } from "./constell.js";

  Constell.init("#scene", {
    star: { count: 90 },
    motion: { speed: 6 }, // faster overall motion
    shootingStar: { chancePerFrame: 0.02 }, // more meteors
  });
</script>
```

Or change settings later at runtime from anywhere in your code:

```js
Constell.configure({ star: { count: 120 } }); // stars are re-seeded automatically
```

For purely visual changes (background colours, blur strength, text colours, etc.) you can override
the documented `--constell-*` CSS custom properties on `:root` without touching any JavaScript.

### 6. Serve the page over HTTP

Browsers refuse to load ES modules from raw `file://` URLs, so you need to serve your page over
HTTP. Any static server works — for example:

```bash
python -m http.server 7070 --directory .
# then open http://localhost:7070
```

Other common options: `npx serve .`, VS Code's _Live Server_ extension, or whatever workflow
you normally use for static sites. Hit reload after editing and the animated background updates
immediately.

---

## JavaScript configuration reference

All values are optional; missing keys fall back to the defaults shown below.

### `star` — star generation & appearance

| Key               | Default  | Description                                           |
| ----------------- | -------- | ----------------------------------------------------- |
| `count`           | `42`     | Total number of stars                                 |
| `depthMin`        | `0.18`   | Minimum depth (affects size, brightness, drift speed) |
| `depthMax`        | `1.0`    | Maximum depth                                         |
| `radiusMin`       | `0.45`   | Minimum star radius (px at full depth)                |
| `radiusMax`       | `2.1`    | Maximum star radius                                   |
| `speedXMin`       | `-0.004` | Minimum horizontal drift speed (normalized/s)         |
| `speedXMax`       | `0.004`  | Maximum horizontal drift speed                        |
| `speedYMin`       | `-0.003` | Minimum vertical drift speed                          |
| `speedYMax`       | `0.003`  | Maximum vertical drift speed                          |
| `twinkleSpeedMin` | `0.5`    | Minimum twinkle oscillation speed (rad/s)             |
| `twinkleSpeedMax` | `2.2`    | Maximum twinkle oscillation speed                     |
| `hueMin`          | `198`    | Minimum hue (degrees, HSL)                            |
| `hueMax`          | `236`    | Maximum hue (degrees, HSL)                            |

### `motion` — animation behaviour

| Key                    | Default | Description                                                                                                                    |
| ---------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `frameMs`              | `100`   | Minimum ms between frames (set to `33` for ~30 fps)                                                                            |
| `pointerLerp`          | `0.07`  | Smoothness of pointer tracking (`0` = none, `1` = instant)                                                                     |
| `prefersReducedMotion` | `false` | Force no animation (stars still twinkle). Pass `true` to freeze all motion.                                                    |
| `speed`                | `5`     | Master speed multiplier for all motion (`1` = very slow, `5` = normal, `10` = 2× speed). No clamping — higher values work too. |

The `speed` value scales star drift/parallax, nebula animation timing, and shooting-star movement/lifespan proportionally. Values below 5 slow everything down; above 5 accelerate it.

### `parallax` — mouse-driven offset

| Key            | Default   | Description                                                          |
| -------------- | --------- | -------------------------------------------------------------------- |
| `sensitivityX` | `0.0006`  | Horizontal drift multiplier per pointer unit (scaled by `1 - depth`) |
| `sensitivityY` | `0.00045` | Vertical drift multiplier                                            |
| `depthFactorX` | `0.05`    | Non-depth parallax offset factor (screen space, X)                   |
| `depthFactorY` | `0.04`    | Non-depth parallax offset factor (screen space, Y)                   |

### `starMotion` — drift speed modifiers

| Key               | Default | Description                           |
| ----------------- | ------- | ------------------------------------- |
| `driftBase`       | `0.14`  | Base drift scale applied to all stars |
| `driftDepthScale` | `0.9`   | Additional drift per depth unit       |

### `visual` — appearance tuning

| Key                    | Default | Description                                    |
| ---------------------- | ------- | ---------------------------------------------- |
| `alphaBase`            | `0.18`  | Base star opacity                              |
| `alphaDepthScale`      | `0.55`  | Opacity added per depth unit (max ≈ 0.73)      |
| `glowThreshold`        | `0.65`  | Depth above which a radial glow is drawn       |
| `glowAlphaMultiplier`  | `0.55`  | Glow opacity relative to star opacity          |
| `glowRadiusMultiplier` | `5`     | Glow radius = `star.radius * multiplier`       |
| `twinkleAmplitude`     | `0.16`  | Sinusoidal brightness variation range (± 16 %) |

### `nebula` — animated background clouds

An array of up to 3 layer objects. Each accepts the keys below:

| Key                 | Default | Description                                              |
| ------------------- | ------- | -------------------------------------------------------- |
| `xBase`             | varies  | Normalised X position (`0–1`, fraction of canvas width)  |
| `yBase`             | varies  | Normalised Y position (`0–1`)                            |
| `radiusScale`       | varies  | Radius = `max(canvasWidth, canvasHeight) * radiusScale`  |
| `color`             | varies  | Radial gradient colour (e.g. `"rgba(126,94,255,0.18)"`)  |
| `driftX.enabled`    | false   | X position animated via `sin(t*freq)` drift offset       |
| `driftX.freq`       | varies  | Oscillation frequency (rad/s)                            |
| `driftX.amount`     | varies  | Drift amplitude as fraction of canvas width              |
| `driftX.invert`     | false   | Negate the X drift offset (layer 2 style)                |
| `driftY.enabled`    | false   | Y position animated via `sin(t*freq)` drift offset       |
| `driftY.freq`       | varies  | Oscillation frequency (rad/s), defaults to `driftX.freq` |
| `driftY.scale`      | 1       | Vertical drift scaling factor                            |
| `driftY.amount`     | varies  | Drift amplitude as fraction of canvas height             |
| `animatedX.enabled` | false   | Pure `sin(t*freq)*width*amount` offset (no drift)        |
| `animatedY.enabled` | false   | Pure `cos`/`sin(t*freq)*height*amount` offset            |
| `animatedY.type`    | `"sin"` | Oscillator — either `"sin"` or `"cos"`                   |
| `parallaxX`         | `0`     | Pointer X parallax multiplier                            |
| `parallaxY`         | `0`     | Pointer Y parallax multiplier                            |

### `shootingStar` — random meteors streaking across the sky

A shooting star spawns randomly at a rate controlled by `chancePerFrame`. Multiple can be active simultaneously (max 2). Each has a bright head with a fading trail.

| Key              | Default | Description                                                                |
| ---------------- | ------- | -------------------------------------------------------------------------- |
| `enabled`        | `true`  | Enable/disable shooting stars entirely                                     |
| `chancePerFrame` | `0.008` | Spawn probability per frame (≈1 every 2s at 60 fps, ≈1 every 4s at 30 fps) |
| `speedMin`       | `4`     | Min speed in pixels/frame                                                  |
| `speedMax`       | `10`    | Max speed in pixels/frame                                                  |
| `angleMin`       | `25`    | Min sweep angle from horizontal in degrees (diagonal streaks)              |
| `angleMax`       | `55`    | Max sweep angle in degrees                                                 |
| `lengthMin`      | `80`    | Minimum trail length in px                                                 |
| `lengthMax`      | `200`   | Maximum trail length in px                                                 |
| `thicknessMin`   | `1.8`   | Minimum head thickness in px                                               |
| `thicknessMax`   | `3.2`   | Maximum head thickness in px                                               |
| `hueMin`         | `190`   | Minimum hue for star color (blue-white range)                              |
| `hueMax`         | `240`   | Maximum hue                                                                |
| `headAlpha`      | `0.95`  | Peak brightness of the head                                                |
| `fadeInFrames`   | `3`     | Frames to reach full brightness on spawn                                   |
| `lifetimeMin`    | `25`    | Minimum lifespan in frames                                                 |
| `lifetimeMax`    | `60`    | Maximum lifespan in frames                                                 |

Example — frequent colorful meteors:

```js
Constell.configure({
  shootingStar: {
    chancePerFrame: 0.03,
    hueMin: 280, // purples
    hueMax: 340,
    speedMin: 6,
    lengthMax: 300,
  },
});
```

Example — disable entirely:

```js
Constell.configure({ shootingStar: { enabled: false } });
```

### `backdrop` — solid gradient background

| Key        | Default   | Description                                |
| ---------- | --------- | ------------------------------------------ |
| `colorTop` | `#030510` | Gradient start & end colour (dark corners) |
| `colorMid` | `#061425` | Mid-stop colour (`midStop` position)       |
| `midStop`  | `0.55`    | Normalised position of the mid-colour stop |

---

### Master speed slider

The `motion.speed` setting (default 5, soft range 1–10) uniformly scales **every** moving thing: star drift, nebula animation timing, and shooting-star travel speed and lifetime.

```js
// Half speed — lazy stars, slow nebulae
Constell.configure({ motion: { speed: 2.5 } });

// Double pace — energetic everything
Constell.configure({ motion: { speed: 10 } });
```

---

## CSS custom properties

These override styling for the demo page overlay and body gradient background. They do **not** affect canvas rendering (that is controlled by JS config above).

| Variable                    | Default                        | Controls                    |
| --------------------------- | ------------------------------ | --------------------------- |
| `--constell-bg-start`       | `#040816`                      | Body gradient start         |
| `--constell-bg-end`         | `#030510`                      | Body gradient end           |
| `--constell-nebula-a`       | `rgba(122,92,255,0.22)`        | CSS radial nebula overlay A |
| `--constell-nebula-b`       | `rgba(0,217,255,0.16)`         | CSS radial nebula overlay B |
| `--constell-overlay-bg`     | `rgba(4,8,22,0.46)`            | Info card background        |
| `--constell-overlay-border` | `rgba(190,210,255,0.14)`       | Info card border colour     |
| `--constell-overlay-blur`   | `18px`                         | Info card backdrop blur     |
| `--constell-overlay-shadow` | `0 24px 80px rgba(0,0,0,0.32)` | Info card drop shadow       |
| `--constell-eyebrow-color`  | `rgba(180,220,255,0.78)`       | Eyebrow label text colour   |
| `--constell-copy-color`     | `rgba(230,239,255,0.78)`       | Body copy text colour       |

Example — purple theming:

```css
:root {
  --constell-nebula-a: rgba(180, 60, 255, 0.25);
  --constell-overlay-bg: rgba(10, 5, 30, 0.5);
  --constell-overlay-border: rgba(200, 160, 255, 0.2);
}
```

---

## Runtime re-configuration

Change any setting after init without reloading the page. Partial configs work — only provided keys merge over the current config.

```js
Constell.configure({
  star: { count: 80 }, // stars are re-seeded automatically
  motion: { frameMs: 16 }, // ~60 fps
  visual: { glowRadiusMultiplier: 6 },
});
```

---

## Theming & Light/Dark Mode

Constell has built-in support for dark and light themes. Both the canvas rendering (stars, nebulae,
shooting stars, backdrop gradient) and the CSS overlay elements switch together when you change theme.
There are three ways to set a theme:

| Mode      | Behaviour                                          |
| --------- | -------------------------------------------------- |
| `"dark"`  | Always use the dark palette                        |
| `"light"` | Always use the light palette                       |
| `"system"`  | Follow the user's OS preference (`prefers-color-scheme`) |

The default is `"dark"`. Set it in your init config:

```js
Constell.init("#scene", { theme: "system" });
```

### Switching themes programmatically

Use `Constell.toggleTheme()` to change the active theme at runtime. It accepts one of the three mode strings and returns the current mode:

```js
// Set a specific theme
Constell.toggleTheme("light");  // force light
Constell.toggleTheme("dark");   // force dark
Constell.toggleTheme("system");   // follow OS preference

// Toggle: dark ↔ light (system is set at init time, not toggled)
Constell.toggleTheme();
```

Internally, `toggleTheme` does two things:
1. **Canvas** — applies the theme's colour values (backdrop gradient, star/nebula/shooting-star colors) into the existing config via `Object.assign`. Your non-theme settings (motion speed, parallax sensitivity, custom overrides) are preserved.
2. **DOM overlay** — sets the `data-theme="dark"` or `data-theme="light"` attribute on `<body>`, which triggers CSS variable overrides in `constell.css` for text and card colors.

### Hooking into your own theme switcher

Most websites already have a light/dark mode toggle (a button, radio group, select, or framework-level provider). Connect Constell to it by calling `Constell.toggleTheme()` from your existing handler.

#### Vanilla JS — boolean flag

```js
let isLight = false;

document.getElementById("my-theme-toggle").addEventListener("click", () => {
  isLight = !isLight;
  Constell.toggleTheme(isLight ? "light" : "dark");
});
```

#### Vanilla JS — string state (e.g. "light" / "dark" stored in localStorage)

```js
function applyStoredTheme() {
  const saved = localStorage.getItem("theme") || "system";
  Constell.toggleTheme(saved);
}

// On your site's theme button click:
document.getElementById("site-theme-btn").addEventListener("click", () => {
  const current = localStorage.getItem("theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  Constell.toggleTheme(next);
});

// On page load:
applyStoredTheme();
```

#### React (hooks + context)

```jsx
import { useEffect, useContext } from "react";
import { Constell } from "./constell.js";
import { ThemeContext } from "./theme-context";

function App() {
  const { theme } = useContext(ThemeContext); // your app's theme state

  useEffect(() => {
    if (!document.querySelector("#scene") && Constell.init) {
      // Init only once on mount
      Constell.init("#scene", { theme });
    } else {
      // Theme changed after init — sync with our context value
      Constell.toggleTheme(theme);
    }
  }, [theme]); // runs whenever React's theme state changes

  return (
    <>
      <canvas id="scene" />
      {/* your site content */}
    </>
  );
}
```

#### Vue 3 (composition API)

```vue
<script setup>
import { onMounted, watch } from "vue";
import { Constell } from "./constell.js";
import { useTheme } from "./use-theme"; // your theme composable

const { theme } = useTheme();

onMounted(() => {
  Constell.init("#scene", { theme: theme.value });
});

// Watch for theme changes after init
watch(theme, (newTheme) => {
  Constell.toggleTheme(newTheme);
});
</script>

<template>
  <canvas id="scene" />
  <!-- your site content -->
</template>
```

#### Astro (SSR / static site)

```jsx
---
import { onMount } from "astro:transitions";
const theme = Astro.cookies.has("theme") ? Astro.cookies.get("theme").value : "system";
---

<canvas id="scene"></canvas>
<script is:inline>
  import { Constell } from "./constell.js";

  Constell.init("#scene", { theme: "{theme}" });
</script>
```

### System mode and OS preference changes

When `theme: "system"`, Constell listens to `prefers-color-scheme` changes in real time. If the user switches their OS between light and dark modes (e.g. on mobile at sunset, or via a system shortcut), Constell's canvas colours and CSS variables update automatically — no page reload needed.

If you need to react in your own code when that happens:

```js
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  if (Constell.config?.theme === "system") {
    // Your app might also want to update fonts, images, etc.
    console.log("OS theme changed:", e.matches ? "dark" : "light");
  }
});
```

### CSS variable theming (non-canvas elements)

Constell ships two complementary styling systems:

| Layer                        | Controlled by                              |
| ---------------------------- | ------------------------------------------ |
| Canvas content (stars, etc.) | JS config `theme` + built-in THEMES object |
| DOM overlay (cards, text)    | CSS variables via `data-theme="light"`     |

If your site already uses CSS custom properties for theming, you can let Constell's CSS variables follow your existing pattern. Just set the same `data-theme` attribute on `<body>` that Constell uses — they are compatible:

```css
/* Your global theme toggle sets this */
[data-theme="light"] {
  --constell-bg-start: #e8ecf4;
  --constell-bg-end:   #f6f8fc;
}
```

The CSS variable values documented in the table above are **only** applied to the DOM overlay elements (cards, text, gradients behind the canvas). The canvas itself is entirely controlled by the JS config — this separation lets you style your page chrome independently from the animated background.

---

## Quick-start (Python dev server)

```bash
python -m http.server 7070 --directory .
# open http://localhost:7070
```
