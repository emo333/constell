# constell.js

Animated constellation background for any webpage — stars, nebulae, parallax, and glow.

```html
<!-- 1. Include CSS (optional; ships a pleasant default) -->
<link rel="stylesheet" href="constell.css">

<!-- 2. Place a canvas element -->
<canvas id="scene"></canvas>

<!-- 3. Initialise with defaults or custom config -->
<script type="module">
  import { Constell } from "./constell.js";

  // Defaults only
  Constell.init("#scene");

  // Or with overrides
  Constell.init("#scene", {
    star:    { count: 60, hueMin: 170, hueMax: 290 },
    motion:  { frameMs: 33 },
    parallax:{ sensitivityX: 0.0008 },
  });
</script>
```

You can also call `Constell.configure(overrides)` at any time to change settings after init — stars are re-seeded when `star.count` changes.

---

## JavaScript configuration reference

All values are optional; missing keys fall back to the defaults shown below.

### `star` — star generation & appearance

| Key | Default | Description |
|-----|---------|-------------|
| `count` | `42` | Total number of stars |
| `depthMin` | `0.18` | Minimum depth (affects size, brightness, drift speed) |
| `depthMax` | `1.0` | Maximum depth |
| `radiusMin` | `0.45` | Minimum star radius (px at full depth) |
| `radiusMax` | `2.1` | Maximum star radius |
| `speedXMin` | `-0.004` | Minimum horizontal drift speed (normalized/s) |
| `speedXMax` | `0.004` | Maximum horizontal drift speed |
| `speedYMin` | `-0.003` | Minimum vertical drift speed |
| `speedYMax` | `0.003` | Maximum vertical drift speed |
| `twinkleSpeedMin` | `0.5` | Minimum twinkle oscillation speed (rad/s) |
| `twinkleSpeedMax` | `2.2` | Maximum twinkle oscillation speed |
| `hueMin` | `198` | Minimum hue (degrees, HSL) |
| `hueMax` | `236` | Maximum hue (degrees, HSL) |

### `motion` — animation behaviour

| Key | Default | Description |
|-----|---------|-------------|
| `frameMs` | `100` | Minimum ms between frames (set to `33` for ~30 fps) |
| `pointerLerp` | `0.07` | Smoothness of pointer tracking (`0` = none, `1` = instant) |
| `prefersReducedMotion` | `false` | Force no animation; respects OS setting unless overridden |

### `parallax` — mouse-driven offset

| Key | Default | Description |
|-----|---------|-------------|
| `sensitivityX` | `0.0006` | Horizontal drift multiplier per pointer unit (scaled by `1 - depth`) |
| `sensitivityY` | `0.00045` | Vertical drift multiplier |
| `depthFactorX` | `0.05` | Non-depth parallax offset factor (screen space, X) |
| `depthFactorY` | `0.04` | Non-depth parallax offset factor (screen space, Y) |

### `starMotion` — drift speed modifiers

| Key | Default | Description |
|-----|---------|-------------|
| `driftBase` | `0.14` | Base drift scale applied to all stars |
| `driftDepthScale` | `0.9` | Additional drift per depth unit |

### `visual` — appearance tuning

| Key | Default | Description |
|-----|---------|-------------|
| `alphaBase` | `0.18` | Base star opacity |
| `alphaDepthScale` | `0.55` | Opacity added per depth unit (max ≈ 0.73) |
| `glowThreshold` | `0.65` | Depth above which a radial glow is drawn |
| `glowAlphaMultiplier` | `0.55` | Glow opacity relative to star opacity |
| `glowRadiusMultiplier` | `5` | Glow radius = `star.radius * multiplier` |
| `twinkleAmplitude` | `0.16` | Sinusoidal brightness variation range (± 16 %) |

### `nebula` — animated background clouds

An array of up to 3 layer objects. Each accepts the keys below:

| Key | Default | Description |
|-----|---------|-------------|
| `xBase` | varies | Normalised X position (`0–1`, fraction of canvas width) |
| `yBase` | varies | Normalised Y position (`0–1`) |
| `radiusScale` | varies | Radius = `max(canvasWidth, canvasHeight) * radiusScale` |
| `color` | varies | Radial gradient colour (e.g. `"rgba(126,94,255,0.18)"`) |
| `driftX.enabled` | false | X position animated via `sin(t*freq)` drift offset |
| `driftX.freq` | varies | Oscillation frequency (rad/s) |
| `driftX.amount` | varies | Drift amplitude as fraction of canvas width |
| `driftX.invert` | false | Negate the X drift offset (layer 2 style) |
| `driftY.enabled` | false | Y position animated via `sin(t*freq)` drift offset |
| `driftY.freq` | varies | Oscillation frequency (rad/s), defaults to `driftX.freq` |
| `driftY.scale` | 1 | Vertical drift scaling factor |
| `driftY.amount` | varies | Drift amplitude as fraction of canvas height |
| `animatedX.enabled` | false | Pure `sin(t*freq)*width*amount` offset (no drift) |
| `animatedY.enabled` | false | Pure `cos`/`sin(t*freq)*height*amount` offset |
| `animatedY.type` | `"sin"` | Function — either `"sin"` or `"cos"` |
| `parallaxX` | 0 | Pointer X parallax multiplier |
| `parallaxY` | 0 | Pointer Y parallax multiplier |

### `shootingStar` — random meteors streaking across the sky

A shooting star spawns randomly at a rate controlled by `chancePerFrame`. Multiple can be active simultaneously (max 2). Each has a bright head with a fading trail.

| Key | Default | Description |
|-----|---------|-------------|
| `enabled` | `true` | Enable/disable shooting stars entirely |
| `chancePerFrame` | `0.008` | Spawn probability per frame (~1 every 2s at 60 fps) |
| `speedMin` | `4` | Min speed in pixels/frame |
| `speedMax` | `10` | Max speed in pixels/frame |
| `angleMin` | `25` | Min sweep angle from horizontal (degrees, diagonal streaks) |
| `angleMax` | `55` | Max sweep angle (degrees) |
| `lengthMin` | `80` | Minimum trail length in px |
| `lengthMax` | `200` | Maximum trail length in px |
| `thicknessMin` | `1.8` | Minimum head thickness in px |
| `thicknessMax` | `3.2` | Maximum head thickness in px |
| `hueMin` | `190` | Minimum hue for star color (blue-white range) |
| `hueMax` | `240` | Maximum hue |
| `headAlpha` | `0.95` | Peak brightness of the head |
| `fadeInFrames` | `3` | Frames to reach full brightness on spawn |
| `lifetimeMin` | `25` | Minimum lifespan in frames |
| `lifetimeMax` | `60` | Maximum lifespan in frames |

Example — frequent colorful meteors:

```js
Constell.configure({
  shootingStar: {
    chancePerFrame: 0.03,
    hueMin: 280,           // purples
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

| Key | Default | Description |
|-----|---------|-------------|
| `colorTop` | `#030510` | Gradient start & end colour (dark corners) |
| `colorMid` | `#061425` | Mid-stop colour (`midStop` position) |
| `midStop` | `0.55` | Normalised position of the mid-colour stop |

---

## CSS custom properties

These override styling for the demo page overlay and body gradient background. They do **not** affect canvas rendering (that is controlled by JS config above).

| Variable | Default | Controls |
|----------|---------|----------|
| `--constell-bg-start` | `#040816` | Body gradient start |
| `--constell-bg-end` | `#030510` | Body gradient end |
| `--constell-nebula-a` | `rgba(122,92,255,0.22)` | CSS radial nebula overlay A |
| `--constell-nebula-b` | `rgba(0,217,255,0.16)` | CSS radial nebula overlay B |
| `--constell-overlay-bg` | `rgba(4,8,22,0.46)` | Info card background |
| `--constell-overlay-border` | `rgba(190,210,255,0.14)` | Info card border colour |
| `--constell-overlay-blur` | `18px` | Info card backdrop blur |
| `--constell-overlay-shadow` | `0 24px 80px rgba(0,0,0,0.32)` | Info card drop shadow |
| `--constell-eyebrow-color` | `rgba(180,220,255,0.78)` | Eyebrow label text colour |
| `--constell-copy-color` | `rgba(230,239,255,0.78)` | Body copy text colour |

Example — purple theming:

```css
:root {
  --constell-nebula-a: rgba(180, 60, 255, 0.25);
  --constell-overlay-bg: rgba(10, 5, 30, 0.50);
  --constell-overlay-border: rgba(200, 160, 255, 0.20);
}
```

---

## Runtime re-configuration

Change any setting after init without reloading the page:

```js
Constell.configure({
  star:    { count: 80 },          // stars are re-seeded automatically
  motion:  { frameMs: 16 },        // ~60 fps
  visual:  { glowRadiusMultiplier: 6 },
});
```

Partial configs work — only the keys you provide are merged; everything else stays as-is.

---

## Quick-start (Python dev server)

```bash
python -m http.server 8001 --directory .
# open http://localhost:8001
```
