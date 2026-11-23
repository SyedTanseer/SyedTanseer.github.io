// Starry night: a twinkling, parallax starfield with the odd shooting star, behind the page.
// Only runs in the dark theme; in light mode the loop stops and the canvas is hidden by CSS.

import { isDark } from "./figures.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const COLORS = [
  [231, 234, 228], // most stars: the page's ink colour
  [255, 179, 143], // a few warm ones, echoing the orange
  [188, 210, 255], // a few cool blue ones
];
const LAYERS = [0.25, 0.55, 1]; // depth: far stars move least

export function setupStars() {
  const canvas = document.createElement("canvas");
  canvas.id = "stars";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");

  let w = 0, h = 0, dpr = 1, stars = [], shooters = [];
  let raf = 0, running = false, nextShot = 0;
  let mx = 0, my = 0, tmx = 0, tmy = 0; // mouse offset, eased

  function makeStars() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(420, Math.round((w * h) / 3000));
    stars = Array.from({ length: count }, () => {
      const layer = LAYERS[Math.floor(Math.random() ** 1.6 * LAYERS.length)]; // mostly far, few near
      const roll = Math.random();
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        d: layer,
        r: (0.45 + Math.random() * 0.85) * (0.6 + layer * 0.75),
        a: 0.4 + Math.random() * 0.6,
        tw: 0.4 + Math.random() * 1.6,     // twinkle speed
        ph: Math.random() * Math.PI * 2,   // twinkle phase
        c: roll < 0.08 ? COLORS[1] : roll < 0.16 ? COLORS[2] : COLORS[0],
      };
    });
  }

  function spawnShooter(now) {
    const angle = (150 + Math.random() * 20) * (Math.PI / 180); // heading down-left
    shooters.push({
      x: w * (0.35 + Math.random() * 0.65),
      y: h * Math.random() * 0.45,
      vx: Math.cos(angle),
      vy: Math.sin(angle),
      speed: 0.9 + Math.random() * 0.6, // px per ms
      len: 110 + Math.random() * 110,
      born: now,
      life: 900 + Math.random() * 500,
    });
    nextShot = now + 5000 + Math.random() * 7000;
  }

  function draw(now) {
    ctx.clearRect(0, 0, w, h);
    mx += (tmx - mx) * 0.04;
    my += (tmy - my) * 0.04;
    const scroll = window.scrollY;

    for (const s of stars) {
      // Parallax: wrap each star vertically as the page scrolls.
      const y = (((s.y - scroll * s.d * 0.12 + my * s.d * 10) % h) + h) % h;
      const x = s.x + mx * s.d * 14;
      const tw = reduceMotion ? 1 : 0.65 + 0.35 * Math.sin(now * 0.001 * s.tw + s.ph);
      const alpha = s.a * tw;
      const [r, g, b] = s.c;
      if (s.r > 1.1) {
        // Bright stars get a faint halo.
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.16})`;
        ctx.beginPath();
        ctx.arc(x, y, s.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (reduceMotion) return;
    if (now > nextShot) spawnShooter(now);
    shooters = shooters.filter((s) => now - s.born < s.life);
    for (const s of shooters) {
      const t = (now - s.born) / s.life;
      const hx = s.x + s.vx * s.speed * (now - s.born);
      const hy = s.y + s.vy * s.speed * (now - s.born);
      const fade = Math.sin(Math.PI * t); // in, then out
      const grad = ctx.createLinearGradient(hx, hy, hx - s.vx * s.len, hy - s.vy * s.len);
      grad.addColorStop(0, `rgba(255,255,255,${0.9 * fade})`);
      grad.addColorStop(0.25, `rgba(255,179,143,${0.45 * fade})`);
      grad.addColorStop(1, "rgba(255,106,48,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx - s.vx * s.len, hy - s.vy * s.len);
      ctx.stroke();
    }
  }

  function loop(now) {
    draw(now);
    raf = requestAnimationFrame(loop);
  }

  // Start or stop depending on the theme and whether the tab is visible.
  function update() {
    const want = isDark() && !document.hidden;
    if (want && !running) {
      running = true;
      nextShot = performance.now() + 2500;
      if (reduceMotion) draw(0);
      else raf = requestAnimationFrame(loop);
    } else if (!want && running) {
      running = false;
      cancelAnimationFrame(raf);
      shooters = [];
    }
  }

  makeStars();
  update();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { makeStars(); if (running && reduceMotion) draw(0); }, 150);
  });
  if (reduceMotion) window.addEventListener("scroll", () => running && draw(0), { passive: true });
  else window.addEventListener("pointermove", (e) => { tmx = e.clientX / w - 0.5; tmy = e.clientY / h - 0.5; }, { passive: true });

  document.addEventListener("visibilitychange", update);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", update);
  new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}
