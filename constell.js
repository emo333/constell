/**
 * Constell — animated constellation background
 *
 * Usage (ESM):
 *   import { Constell } from './constell.js';
 *   Constell.init(canvas);                              // defaults
 *   Constell.init(canvas, userConfig);                  // with overrides
 *   Constell.configure(overrides);                      // runtime re-config
 */

/* ──────────────────────────────────────────────
   Default configuration — all magic numbers live here
   ────────────────────────────────────────────── */
const DEFAULT_CONFIG = {
  star: {
    count: 42,
    depthMin: 0.18,
    depthMax: 1.0,
    radiusMin: 0.45,
    radiusMax: 2.1,
    speedXMin: -0.004,
    speedXMax: 0.004,
    speedYMin: -0.003,
    speedYMax: 0.003,
    twinkleSpeedMin: 0.5,
    twinkleSpeedMax: 2.2,
    hueMin: 198,
    hueMax: 236,
  },

  motion: {
    frameMs: 100,           // ≈ 10 fps (min ms between frames)
    pointerLerp: 0.07,      // smoothness of pointer tracking
    prefersReducedMotion: false,
  },

  parallax: {
    sensitivityX: 0.0006,
    sensitivityY: 0.00045,
    depthFactorX: 0.05,     // non-depth parallax on screen coords (X)
    depthFactorY: 0.04,     // non-depth parallax on screen coords (Y)
  },

  starMotion: {
    driftBase: 0.14,
    driftDepthScale: 0.9,   // how much depth amplifies drift speed
  },

  visual: {
    alphaBase: 0.18,
    alphaDepthScale: 0.55,
    glowThreshold: 0.65,     // star.depth above which a glow is drawn
    glowAlphaMultiplier: 0.55,
    glowRadiusMultiplier: 5,
    twinkleAmplitude: 0.16,
  },

  nebula: [
    // Layer 1 — slow sine drift + pointer parallax
    {
      xBase: 0.22, yBase: 0.24, radiusScale: 0.42,
      color: "rgba(126, 94, 255, 0.18)",
      driftX: { enabled: true, freq: 0.4, amount: 0.1 },
      driftY: { enabled: true, freq: 0.35, amount: 0.06 },
      parallaxX: 0.08, parallaxY: 0.08,
    },
    // Layer 2 — inverted sine drift + pointer parallax
    {
      xBase: 0.82, yBase: 0.28, radiusScale: 0.36,
      color: "rgba(0, 224, 255, 0.14)",
      driftX: { enabled: true, freq: 0.38, amount: 0.08, invert: true },
      driftY: { enabled: true, freq: 0.32, amount: 0.06, scale: 0.5 },
      parallaxX: 0.05, parallaxY: 0.05,
    },
    // Layer 3 — pure sin/cos position animation
    {
      xBase: 0.52, yBase: 0.72, radiusScale: 0.48,
      color: "rgba(255, 121, 214, 0.08)",
      animatedX: { enabled: true, freq: 0.35, amount: 0.08 },
      animatedY: { enabled: true, freq: 0.3, amount: 0.06, type: "cos" },
      parallaxX: 0, parallaxY: 0,
    },
  ],

  backdrop: {
    colorTop: "#030510",
    colorMid: "#061425",
    midStop: 0.55,
  },
};

/* ──────────────────────────────────────────────
   Config helpers — deep merge with defaults
   ────────────────────────────────────────────── */

/**
 * Deep-merge a user config over the defaults (shallow on first level,
 * merges star / motion / parallax / visual / nebula sub-objects).
 */
function mergeConfig(user) {
  const cfg = structuredClone(DEFAULT_CONFIG);

  if (!user) return cfg;

  // Merge top-level known groups
  for (const key of ["star", "motion", "parallax", "visual"]) {
    if (key in user && typeof user[key] === "object") {
      Object.assign(cfg[key], user[key]);
    } else if (key in user) {
      cfg[key] = user[key]; // replace entirely (rare)
    }
  }

  // Nebula array: shallow-merge each slot by index
  if (Array.isArray(user.nebula)) {
    for (let i = 0; i < user.nebula.length; i++) {
      if (i < cfg.nebula.length && typeof user.nebula[i] === "object") {
        Object.assign(cfg.nebula[i], user.nebula[i]);
      } else {
        cfg.nebula[i] = structuredClone(user.nebula[i]);
      }
    }
  }

  // Backdrop
  if (user.backdrop && typeof user.backdrop === "object") {
    Object.assign(cfg.backdrop, user.backdrop);
  }

  return cfg;
}

/* ──────────────────────────────────────────────
   Module state
   ────────────────────────────────────────────── */

let canvas, context;
let config = DEFAULT_CONFIG;       // live (merged) config
let stars = [];
let pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
let width = 0, height = 0, dpr = 1;
let lastFrameTime = 0;
let animationId = null;
let initialized = false;

/* ──────────────────────────────────────────────
   Math helpers (kept as bare functions for perf)
   ────────────────────────────────────────────── */

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

/* ──────────────────────────────────────────────
   Star lifecycle
   ────────────────────────────────────────────── */

function createStar() {
  const s = config.star;
  return {
    x: Math.random(),
    y: Math.random(),
    depth: random(s.depthMin, s.depthMax),
    radius: random(s.radiusMin, s.radiusMax),
    speedX: random(s.speedXMin, s.speedXMax),
    speedY: random(s.speedYMin, s.speedYMax),
    twinkleSpeed: random(s.twinkleSpeedMin, s.twinkleSpeedMax),
    phase: Math.random() * Math.PI * 2,
    hue: random(s.hueMin, s.hueMax),
    screenX: 0,
    screenY: 0,
    twinkle: 1,
  };
}

function seedStars() {
  stars.length = 0;
  for (let i = 0; i < config.star.count; i++) {
    stars.push(createStar());
  }
}

/* ──────────────────────────────────────────────
   Canvas sizing
   ────────────────────────────────────────────── */

function resize() {
  dpr = 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/* ──────────────────────────────────────────────
   Drawing — backdrop (gradient + nebulae)
   ────────────────────────────────────────────── */

function drawBackdrop(time) {
  const c = config;
  const px = pointer.x * width;
  const py = pointer.y * height;

  // ── Gradient background ──
  const grad = context.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, c.backdrop.colorTop);
  grad.addColorStop(c.backdrop.midStop, c.backdrop.colorMid);
  grad.addColorStop(1, c.backdrop.colorTop);
  context.fillStyle = grad;
  context.fillRect(0, 0, width, height);

  // ── Nebula layers ──
  context.save();
  context.globalCompositeOperation = "screen";

  for (const layer of c.nebula) {
    const t = time;
    let offsetX = 0, offsetY = 0;

    // Drift-based movement (sine waves)
    if (layer.driftX?.enabled) {
      const d = Math.sin(t * layer.driftX.freq) * width * layer.driftX.amount;
      offsetX += layer.driftX.invert ? -d : d;
    }
    if (layer.driftY?.enabled) {
      const freq = layer.driftY.freq ?? layer.driftX?.freq ?? 0;
      const d = Math.sin(t * freq) * height * layer.driftY.amount;
      offsetY += (layer.driftY.scale ?? 1) * d;
    }

    // Pure sin/cos position animation
    if (!layer.driftX?.enabled && layer.animatedX?.enabled) {
      offsetX = Math.sin(t * layer.animatedX.freq) * width * layer.animatedX.amount;
    }
    if (!layer.driftY?.enabled && layer.animatedY?.enabled) {
      const fn = layer.animatedY.type === "cos" ? Math.cos : Math.sin;
      offsetY = fn(t * layer.animatedY.freq) * height * layer.animatedY.amount;
    }

    // Pointer parallax
    offsetX += (px - width * 0.5) * (layer.parallaxX ?? 0);
    offsetY += (py - height * 0.5) * (layer.parallaxY ?? 0);

    const cx = width * layer.xBase + offsetX;
    const cy = height * layer.yBase + offsetY;
    const radius = Math.max(width, height) * layer.radiusScale;

    // Build gradient — fade alpha to ~1/3 at mid-stop
    const fadedColor = layer.color.replace(/([\d.]+)(?=\))/, (m) =>
      (parseFloat(m) * 0.33).toFixed(2),
    );
    const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, layer.color);
    gradient.addColorStop(0.55, fadedColor);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  context.restore();
}

/* ──────────────────────────────────────────────
   Drawing — stars + glow
   ────────────────────────────────────────────── */

function drawStars() {
  const c = config;
  context.save();
  context.globalCompositeOperation = "lighter";

  for (const star of stars) {
    const radius = star.radius * (0.7 + star.depth * 0.9) * star.twinkle;
    const alpha = c.visual.alphaBase + star.depth * c.visual.alphaDepthScale;
    const hue = star.hue;

    context.fillStyle = `hsla(${hue}, 100%, 88%, ${alpha})`;
    context.beginPath();
    context.arc(star.screenX, star.screenY, radius, 0, Math.PI * 2);
    context.fill();

    if (star.depth > c.visual.glowThreshold) {
      const glowRadius = radius * c.visual.glowRadiusMultiplier;
      const glow = context.createRadialGradient(
        star.screenX, star.screenY, 0,
        star.screenX, star.screenY, glowRadius,
      );
      glow.addColorStop(0, `hsla(${hue}, 100%, 85%, ${alpha * c.visual.glowAlphaMultiplier})`);
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = glow;
      context.beginPath();
      context.arc(star.screenX, star.screenY, glowRadius, 0, Math.PI * 2);
      context.fill();
    }
  }

  context.restore();
}

/* ──────────────────────────────────────────────
   Update — parallax, drift, twinkle
   ────────────────────────────────────────────── */

function updateStars(time) {
  const c = config;
  const pointerX = pointer.x - 0.5;
  const pointerY = pointer.y - 0.5;

  for (const star of stars) {
    if (!c.motion.prefersReducedMotion) {
      const driftScale = c.starMotion.driftBase + star.depth * c.starMotion.driftDepthScale;
      star.x = (star.x + star.speedX * driftScale
        + pointerX * c.parallax.sensitivityX * (1 - star.depth)
        + 1) % 1;
      star.y = (star.y + star.speedY * driftScale
        + pointerY * c.parallax.sensitivityY * (1 - star.depth)
        + 1) % 1;
    }

    star.screenX = star.x * width
      + pointerX * width * c.parallax.depthFactorX * (1 - star.depth);
    star.screenY = star.y * height
      + pointerY * height * c.parallax.depthFactorY * (1 - star.depth);
    star.twinkle = 1 + Math.sin(time * star.twinkleSpeed + star.phase) * c.visual.twinkleAmplitude;
  }
}

/* ──────────────────────────────────────────────
   Render loop
   ────────────────────────────────────────────── */

function render(timestamp) {
  const c = config.motion;

  if (lastFrameTime && timestamp - lastFrameTime < c.frameMs) {
    animationId = requestAnimationFrame(render);
    return;
  }

  lastFrameTime = timestamp;
  const time = timestamp * 0.001;

  pointer.x = lerp(pointer.x, pointer.targetX, c.pointerLerp);
  pointer.y = lerp(pointer.y, pointer.targetY, c.pointerLerp);

  context.clearRect(0, 0, width, height);
  drawBackdrop(time);
  updateStars(time);
  drawStars();

  if (c.prefersReducedMotion) return;  // still render but don't loop
  animationId = requestAnimationFrame(render);
}

/* ──────────────────────────────────────────────
   Event wiring
   ────────────────────────────────────────────── */

function bindEvents() {
  window.addEventListener("resize", resize, { passive: true });

  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.targetX = clamp(event.clientX / Math.max(width, 1), 0, 1);
      pointer.targetY = clamp(event.clientY / Math.max(height, 1), 0, 1);
    },
    { passive: true },
  );

  window.addEventListener("pointerleave", () => {
    pointer.targetX = 0.5;
    pointer.targetY = 0.5;
  }, { passive: true });

  window.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      lastFrameTime = 0;
      startRender();
    }
  });
}

function startRender() {
  stopRender();
  animationId = requestAnimationFrame(render);
}

function stopRender() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

/* ──────────────────────────────────────────────
   Public API
   ────────────────────────────────────────────── */

/**
 * Initialise the constellation background on a canvas element.
 * @param {HTMLCanvasElement} el — the <canvas> to render into (or an id string)
 * @param {object}            [userConfig] — runtime configuration overrides
 */
function init(el, userConfig) {
  if (initialized) return; // already running

  canvas = typeof el === "string" ? document.querySelector(el) : el;
  if (!canvas) throw new Error(`Constell: canvas "${el}" not found`);

  context = canvas.getContext("2d", { alpha: true, desynchronized: true });
  config = userConfig ? mergeConfig(userConfig) : structuredClone(DEFAULT_CONFIG);



  resize();
  seedStars();
  bindEvents();
  startRender();
  initialized = true;
}

/**
 * Apply configuration overrides at runtime.
 * Stars are re-seeded when star.count changes.
 * @param {object} overrides — partial config to merge over the current one
 */
function configure(overrides) {
  if (!initialized) throw new Error("Constell: call init() before configure()");

  const countBefore = config.star.count;
  config = mergeConfig(overrides);



  // Re-seed if star count changed
  if (config.star.count !== countBefore) {
    seedStars();
  }
}

/* ──────────────────────────────────────────────
   Exports
   ────────────────────────────────────────────── */

const Constell = { init, configure };

export { Constell };

// Also support non-module usage via a global when imported as <script>
if (typeof window !== "undefined") {
  window.Constell = Constell;
}
