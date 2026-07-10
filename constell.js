const canvas = document.querySelector("#scene");
const context = canvas.getContext("2d", { alpha: true, desynchronized: true });

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const STAR_COUNT = 42;
const FRAME_MS = 100;
const stars = [];
const pointer = {
  x: 0.5,
  y: 0.5,
  targetX: 0.5,
  targetY: 0.5,
};

let width = 0;
let height = 0;
let dpr = 1;
let lastFrameTime = 0;

// Clamp a value between a minimum and maximum.
// `value` comes from pointer input or animation math, while the bounds are
// supplied by the call site.
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Ease one value toward another.
// `from`, `to`, and `amount` are derived by the render loop.
function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

// Return a random number in a caller-defined range.
// `min` and `max` are chosen per property when stars are created.
function random(min, max) {
  return min + Math.random() * (max - min);
}

// Create one star with randomized position, motion, and glow settings.
// The normalized coordinates let the render loop map stars to any canvas size.
function createStar() {
  return {
    x: Math.random(),
    y: Math.random(),
    depth: random(0.18, 1),
    radius: random(0.45, 2.1),
    speedX: random(-0.004, 0.004),
    speedY: random(-0.003, 0.003),
    twinkleSpeed: random(0.5, 2.2),
    phase: Math.random() * Math.PI * 2,
    hue: random(198, 236),
  };
}

// Rebuild the star array so it matches the configured count.
function seedStars() {
  stars.length = 0;
  for (let index = 0; index < STAR_COUNT; index += 1) {
    stars.push(createStar());
  }
}

// Resize the canvas to the browser viewport.
// `window.innerWidth` and `window.innerHeight` come directly from the browser.
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

// Draw the background gradient and the drifting nebula layers.
// `time` is the RAF timestamp converted to seconds in `render()`.
function drawBackdrop(time) {
  const px = pointer.x * width;
  const py = pointer.y * height;
  const driftX = Math.cos(time * 0.12) * width * 0.06;
  const driftY = Math.sin(time * 0.09) * height * 0.05;

  const base = context.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, "#030510");
  base.addColorStop(0.55, "#061425");
  base.addColorStop(1, "#030510");
  context.fillStyle = base;
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalCompositeOperation = "screen";

  const nebulae = [
    {
      x: width * 0.22 + driftX + (px - width * 0.5) * 0.08,
      y: height * 0.24 + driftY + (py - height * 0.5) * 0.08,
      radius: Math.max(width, height) * 0.42,
      color: "rgba(126, 94, 255, 0.18)",
    },
    {
      x: width * 0.82 - driftX * 0.7 + (px - width * 0.5) * 0.05,
      y: height * 0.28 + driftY * 0.4 + (py - height * 0.5) * 0.05,
      radius: Math.max(width, height) * 0.36,
      color: "rgba(0, 224, 255, 0.14)",
    },
    {
      x: width * 0.52 + Math.sin(time * 0.16) * width * 0.08,
      y: height * 0.72 + Math.cos(time * 0.14) * height * 0.05,
      radius: Math.max(width, height) * 0.48,
      color: "rgba(255, 121, 214, 0.08)",
    },
  ];

  for (const layer of nebulae) {
    const gradient = context.createRadialGradient(
      layer.x,
      layer.y,
      0,
      layer.x,
      layer.y,
      layer.radius,
    );
    gradient.addColorStop(0, layer.color);
    gradient.addColorStop(0.55, layer.color.replace(/0\.[0-9]+\)/, "0.06)"));
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  context.restore();
}

// Update each star's drift, parallax offset, and twinkle phase.
// `time` comes from the RAF timestamp in seconds.
function updateStars(time) {
  const pointerX = pointer.x - 0.5;
  const pointerY = pointer.y - 0.5;

  for (const star of stars) {
    if (!prefersReducedMotion) {
      const driftScale = 0.14 + star.depth * 0.9;
      star.x =
        (star.x + star.speedX * driftScale + pointerX * 0.0006 * (1 - star.depth) + 1) %
        1;
      star.y =
        (star.y + star.speedY * driftScale + pointerY * 0.00045 * (1 - star.depth) + 1) %
        1;
    }

    star.screenX = star.x * width + pointerX * width * (1 - star.depth) * 0.05;
    star.screenY = star.y * height + pointerY * height * (1 - star.depth) * 0.04;
    star.twinkle = 1 + Math.sin(time * star.twinkleSpeed + star.phase) * 0.16;
  }
}

// Draw the star field and the glow around the brightest stars.
function drawStars() {
  context.save();
  context.globalCompositeOperation = "lighter";

  for (const star of stars) {
    const radius = star.radius * (0.7 + star.depth * 0.9) * star.twinkle;
    const alpha = 0.18 + star.depth * 0.55;
    const hue = star.hue;

    context.fillStyle = `hsla(${hue}, 100%, 88%, ${alpha})`;
    context.beginPath();
    context.arc(star.screenX, star.screenY, radius, 0, Math.PI * 2);
    context.fill();

    if (star.depth > 0.65) {
      const glow = context.createRadialGradient(
        star.screenX,
        star.screenY,
        0,
        star.screenX,
        star.screenY,
        radius * 5,
      );
      glow.addColorStop(0, `hsla(${hue}, 100%, 85%, ${alpha * 0.55})`);
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = glow;
      context.beginPath();
      context.arc(star.screenX, star.screenY, radius * 5, 0, Math.PI * 2);
      context.fill();
    }
  }

  context.restore();
}

// The main animation loop, called by `requestAnimationFrame`.
// `timestamp` is the browser-supplied high resolution time for the current frame.
function render(timestamp) {
  if (lastFrameTime && timestamp - lastFrameTime < FRAME_MS) {
    requestAnimationFrame(render);
    return;
  }

  lastFrameTime = timestamp;
  const time = timestamp * 0.001;
  pointer.x = lerp(pointer.x, pointer.targetX, 0.07);
  pointer.y = lerp(pointer.y, pointer.targetY, 0.07);

  context.clearRect(0, 0, width, height);
  drawBackdrop(time);
  updateStars(time);
  drawStars();

  if (!prefersReducedMotion) {
    requestAnimationFrame(render);
  }
}

window.addEventListener("resize", resize, { passive: true });

window.addEventListener(
  "pointermove",
  // `event` is the browser pointer event; its coordinates drive the parallax.
  (event) => {
    pointer.targetX = clamp(event.clientX / Math.max(width, 1), 0, 1);
    pointer.targetY = clamp(event.clientY / Math.max(height, 1), 0, 1);
  },
  { passive: true },
);

window.addEventListener(
  "pointerleave",
  // When the pointer leaves, ease the field back to center.
  () => {
    pointer.targetX = 0.5;
    pointer.targetY = 0.5;
  },
  { passive: true },
);

// Restart the animation timer when the tab becomes visible again.
window.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    lastFrameTime = 0;
    requestAnimationFrame(render);
  }
});

resize();
seedStars();
requestAnimationFrame(render);
