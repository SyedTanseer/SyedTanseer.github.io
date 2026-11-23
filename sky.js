// The sky behind the page, drawn on one canvas.
//   Light mode (day):  sketched clouds drifting across the page, flocks of birds, and a line-drawn sun.
//   Dark mode (night): a twinkling parallax starfield, a crescent moon and the odd shooting star.
// Both the sun and the moon sit in the gap between the name and the waving figure,
// with a detection tag ("sun 0.98" / "moon 0.97") like the rest of the site.

import { isDark } from "./figures.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const TAU = Math.PI * 2;

const STAR_COLORS = [
  [231, 234, 228], // most stars: the page's ink colour
  [255, 179, 143], // a few warm ones, echoing the orange
  [188, 210, 255], // a few cool blue ones
];
const LAYERS = [0.25, 0.55, 1]; // depth: far things move least

export function setupSky() {
  const canvas = document.createElement("canvas");
  canvas.id = "sky";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");

  let w = 0, h = 0, dpr = 1;
  let stars = [], shooters = [], clouds = [], flocks = [];
  let raf = 0, running = false, night = isDark();
  let nextShot = 0, nextFlock = 0, startedAt = 0, lastNow = 0;
  let orb = null;            // where the sun/moon goes: { x, y, r }
  let sprites = {};          // pre-rendered sun/moon, rebuilt when the theme or size changes
  let mx = 0, my = 0, tmx = 0, tmy = 0; // mouse offset, eased

  const depthOf = () => LAYERS[Math.floor(Math.random() ** 1.6 * LAYERS.length)]; // mostly far, few near

  /* ---------------- Setup ---------------- */

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sprites = {};

    const starCount = Math.min(420, Math.round((w * h) / 3000));
    stars = Array.from({ length: starCount }, () => {
      const d = depthOf(), roll = Math.random();
      return {
        x: Math.random() * w, y: Math.random() * h, d,
        r: (0.45 + Math.random() * 0.85) * (0.6 + d * 0.75),
        a: 0.4 + Math.random() * 0.6,
        tw: 0.4 + Math.random() * 1.6,
        ph: Math.random() * TAU,
        c: roll < 0.08 ? STAR_COLORS[1] : roll < 0.16 ? STAR_COLORS[2] : STAR_COLORS[0],
      };
    });

    const cloudCount = Math.max(5, Math.min(14, Math.round((w * h) / 95000)));
    clouds = Array.from({ length: cloudCount }, () => makeCloud(depthOf(), Math.random() * w));
  }

  /* ---------------- Clouds (day) ---------------- */

  // A cloud is a few overlapping puffs on a flat base, pre-rendered with a thin sketched outline.
  function makeCloud(d, x) {
    const scale = (0.45 + d * 0.75) * (w < 700 ? 0.7 : 1);
    const W = (130 + Math.random() * 150) * scale;
    const n = 4 + Math.floor(Math.random() * 3);
    const puffs = Array.from({ length: n }, (_, i) => {
      const mid = 1 - Math.abs(i - (n - 1) / 2) / ((n - 1) / 2 + 0.001); // 1 in the middle, 0 at the ends
      const r = W * (0.13 + Math.random() * 0.06) * (0.75 + mid * 0.6);
      return { x: (W * (i + 0.5)) / n + (Math.random() - 0.5) * W * 0.06, r };
    });
    const maxR = Math.max(...puffs.map((p) => p.r));
    const pad = 4, base = maxR * 1.45 + pad;
    const cw = W + maxR * 1.2 + pad * 2, ch = base + pad;
    const ox = (cw - W) / 2;

    const c = document.createElement("canvas");
    c.width = Math.ceil(cw * dpr);
    c.height = Math.ceil(ch * dpr);
    const g = c.getContext("2d");
    g.scale(dpr, dpr);
    g.beginPath();
    g.rect(0, 0, cw, base); // flat bottom
    g.clip();
    const circles = () => {
      g.beginPath();
      for (const p of puffs) { g.moveTo(ox + p.x + p.r, base - p.r * 0.55); g.arc(ox + p.x, base - p.r * 0.55, p.r, 0, TAU); }
    };
    // Stroke first, then fill on top: only the outer half of the outline survives, tracing the cloud's silhouette.
    g.lineWidth = 2.6;
    g.strokeStyle = "rgba(38, 42, 38, 0.2)";
    circles(); g.stroke();
    const fill = g.createLinearGradient(0, base - maxR * 1.5, 0, base);
    fill.addColorStop(0, "rgba(255, 255, 255, 0.96)");
    fill.addColorStop(1, "rgba(233, 237, 231, 0.94)");
    g.fillStyle = fill;
    circles(); g.fill();
    // Base line
    const left = ox + puffs[0].x - puffs[0].r * 0.83, right = ox + puffs[n - 1].x + puffs[n - 1].r * 0.83;
    g.strokeStyle = "rgba(38, 42, 38, 0.2)";
    g.lineWidth = 1.3;
    g.beginPath(); g.moveTo(left, base - 0.7); g.lineTo(right, base - 0.7); g.stroke();

    return {
      sprite: c, cw, ch, d, x, y: Math.random() * h,
      speed: 4 + d * 12,              // px per second
      alpha: 0.5 + d * 0.45,
    };
  }

  function drawClouds(dt, scroll) {
    for (const c of clouds) {
      if (!reduceMotion) c.x += (c.speed * dt) / 1000;
      if (c.x > w + 40) c.x = -c.cw - 40;
      const span = h + c.ch;
      const y = ((((c.y - scroll * c.d * 0.12 + my * c.d * 10) % span) + span) % span) - c.ch;
      ctx.globalAlpha = c.alpha;
      ctx.drawImage(c.sprite, c.x + mx * c.d * 14, y, c.cw, c.ch);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------------- Birds (day) ---------------- */

  // A small flock in a loose V crosses the sky every so often.
  function spawnFlock(now) {
    const dir = Math.random() < 0.5 ? 1 : -1;
    const d = depthOf();
    const scale = (0.55 + d * 0.75) * (w < 700 ? 0.8 : 1);
    const count = 3 + Math.floor(Math.random() * 4);
    const birds = Array.from({ length: count }, (_, i) => {
      const rank = Math.ceil(i / 2), side = i % 2 ? -1 : 1; // leader, then alternating wings of the V
      return {
        dx: -dir * rank * 22 * scale + (Math.random() - 0.5) * 8 * scale,
        dy: side * rank * 11 * scale + (Math.random() - 0.5) * 6 * scale,
        flap: 2.2 + Math.random() * 1.2, // wingbeats per second
        ph: Math.random() * TAU,
      };
    });
    flocks.push({
      dir, d, scale, birds,
      x: dir > 0 ? -80 : w + 80,
      y: h * (0.08 + Math.random() * 0.42) + window.scrollY * d * 0.12,
      speed: (34 + d * 46) * (0.85 + Math.random() * 0.3), // px per second
    });
    nextFlock = now + 9000 + Math.random() * 7000;
  }

  function drawBirds(now, dt, scroll) {
    if (now > nextFlock) spawnFlock(now);
    const t = now / 1000;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const f of flocks) {
      f.x += (f.dir * f.speed * dt) / 1000;
      const baseY = f.y - scroll * f.d * 0.12 + my * f.d * 10;
      ctx.strokeStyle = `rgba(38, 42, 38, ${0.45 + f.d * 0.4})`;
      ctx.lineWidth = 1.1 + f.d * 0.5;
      for (const b of f.birds) {
        const s = 7 * f.scale;
        const x = f.x + b.dx + mx * f.d * 14;
        const y = baseY + b.dy + Math.sin(t * 1.3 + b.ph) * 2 * f.scale; // gentle bob
        // Flap, then glide: the wing lift eases off for part of each cycle.
        const beat = Math.sin(t * b.flap * TAU + b.ph);
        const lift = s * (0.15 + 0.5 * Math.max(beat, -0.4));
        ctx.beginPath();
        ctx.moveTo(x - s, y - lift);
        ctx.quadraticCurveTo(x - s * 0.45, y - lift * 0.2 - s * 0.18, x, y);
        ctx.quadraticCurveTo(x + s * 0.45, y - lift * 0.2 - s * 0.18, x + s, y - lift);
        ctx.stroke();
      }
    }
    // Drop flocks once every bird is off screen.
    flocks = flocks.filter((f) => (f.dir > 0 ? f.x - 160 * f.scale < w + 40 : f.x + 160 * f.scale > -40));
  }

  /* ---------------- Stars (night) ---------------- */

  function drawStars(now, scroll) {
    for (const s of stars) {
      const y = (((s.y - scroll * s.d * 0.12 + my * s.d * 10) % h) + h) % h;
      const x = s.x + mx * s.d * 14;
      const tw = reduceMotion ? 1 : 0.65 + 0.35 * Math.sin(now * 0.001 * s.tw + s.ph);
      const alpha = s.a * tw;
      const [r, g, b] = s.c;
      if (s.r > 1.1) {
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.16})`;
        ctx.beginPath(); ctx.arc(x, y, s.r * 3.2, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.beginPath(); ctx.arc(x, y, s.r, 0, TAU); ctx.fill();
    }
  }

  function spawnShooter(now) {
    const angle = (150 + Math.random() * 20) * (Math.PI / 180); // heading down-left
    shooters.push({
      x: w * (0.35 + Math.random() * 0.65), y: h * Math.random() * 0.45,
      vx: Math.cos(angle), vy: Math.sin(angle),
      speed: 0.9 + Math.random() * 0.6, len: 110 + Math.random() * 110,
      born: now, life: 900 + Math.random() * 500,
    });
    nextShot = now + 5000 + Math.random() * 7000;
  }

  function drawShooters(now) {
    if (now > nextShot) spawnShooter(now);
    shooters = shooters.filter((s) => now - s.born < s.life);
    for (const s of shooters) {
      const age = now - s.born, fade = Math.sin(Math.PI * (age / s.life));
      const hx = s.x + s.vx * s.speed * age, hy = s.y + s.vy * s.speed * age;
      const grad = ctx.createLinearGradient(hx, hy, hx - s.vx * s.len, hy - s.vy * s.len);
      grad.addColorStop(0, `rgba(255,255,255,${0.9 * fade})`);
      grad.addColorStop(0.25, `rgba(255,179,143,${0.45 * fade})`);
      grad.addColorStop(1, "rgba(255,106,48,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - s.vx * s.len, hy - s.vy * s.len); ctx.stroke();
    }
  }

  /* ---------------- Sun and moon ---------------- */

  // Place the sun/moon in the empty space between the name and the waving figure.
  function layoutOrb() {
    const words = [...document.querySelectorAll("#name .line:first-child .word")];
    const buddy = document.querySelector(".buddy");
    if (!words.length || !buddy) return (orb = null);
    const rects = words.map((el) => el.getBoundingClientRect());
    const nameRight = Math.max(...rects.map((r) => r.right));
    const gap = buddy.getBoundingClientRect().left - nameRight;
    const r = Math.min(38, gap / 2 - 24); // leaves ~15px between the tag's frame and the text/figure
    if (r < 12) return (orb = null);      // no room: skip it rather than cover text
    orb = { x: nameRight + gap / 2, y: rects[0].top + rects[0].height / 2 + window.scrollY, r };
    sprites = {};
  }

  function newSprite(r) {
    const size = 2 * r + 4;
    const c = document.createElement("canvas");
    c.width = c.height = Math.ceil(size * dpr);
    const g = c.getContext("2d");
    g.scale(dpr, dpr);
    return { c, g, cx: r + 2, cy: r + 2 };
  }

  function moonSprite(r) {
    const { c, g, cx, cy } = newSprite(r);
    const disk = () => { g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill(); };
    const lit = g.createRadialGradient(cx + r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
    lit.addColorStop(0, "#fbf8ee");
    lit.addColorStop(1, "#d6d1c0");
    g.fillStyle = lit;
    disk();
    g.fillStyle = "rgba(140, 134, 118, 0.28)";
    for (const [dx, dy, cr] of [[0.42, -0.25, 0.17], [0.55, 0.3, 0.12], [0.2, 0.45, 0.1], [0.68, -0.02, 0.08], [0.3, 0.05, 0.07]]) {
      g.beginPath(); g.arc(cx + dx * r, cy + dy * r, cr * r, 0, TAU); g.fill();
    }
    // Carve the shadow to leave a waxing crescent on the right.
    g.globalCompositeOperation = "destination-out";
    g.fillStyle = "#000";
    g.beginPath(); g.arc(cx - r * 0.62, cy - r * 0.1, r * 1.02, 0, TAU); g.fill();
    // Faint earthshine on the dark part, over an opaque disk that hides stars behind it.
    g.globalCompositeOperation = "destination-over";
    g.fillStyle = "rgba(231, 234, 228, 0.09)";
    disk();
    g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#131613";
    disk();
    return c;
  }

  function sunDisk(r) {
    const { c, g, cx, cy } = newSprite(r);
    const body = g.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
    body.addColorStop(0, "#ffd58a");
    body.addColorStop(1, "#ff9a3c");
    g.fillStyle = body;
    g.beginPath(); g.arc(cx, cy, r * 0.62, 0, TAU); g.fill();
    g.lineWidth = 1.6;
    g.strokeStyle = "#262a26";
    g.stroke();
    // A smaller inner ring, like a drafting compass mark.
    g.lineWidth = 1;
    g.strokeStyle = "rgba(38, 42, 38, 0.35)";
    g.beginPath(); g.arc(cx, cy, r * 0.42, 0, TAU); g.stroke();
    return c;
  }

  function drawSun(x, y, r, now) {
    const halo = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2.6);
    halo.addColorStop(0, "rgba(255, 196, 110, 0.35)");
    halo.addColorStop(1, "rgba(255, 196, 110, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, TAU); ctx.fill();

    // Rays: alternating long and short strokes, turning slowly.
    const spin = reduceMotion ? 0 : (now / 60000) * TAU;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.strokeStyle = "#262a26";
    ctx.lineCap = "round";
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU, long = i % 2 === 0;
      ctx.lineWidth = long ? 1.6 : 1.2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.74, Math.sin(a) * r * 0.74);
      ctx.lineTo(Math.cos(a) * r * (long ? 1 : 0.88), Math.sin(a) * r * (long ? 1 : 0.88));
      ctx.stroke();
    }
    ctx.restore();

    const key = "sun" + r;
    sprites[key] ||= sunDisk(r);
    ctx.drawImage(sprites[key], x - r - 2, y - r - 2, 2 * r + 4, 2 * r + 4);
  }

  function drawMoon(x, y, r) {
    const halo = ctx.createRadialGradient(x, y, r * 0.9, x, y, r * 3.4);
    halo.addColorStop(0, "rgba(255, 240, 215, 0.13)");
    halo.addColorStop(1, "rgba(255, 240, 215, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(x, y, r * 3.4, 0, TAU); ctx.fill();
    const key = "moon" + r;
    sprites[key] ||= moonSprite(r);
    ctx.drawImage(sprites[key], x - r - 2, y - r - 2, 2 * r + 4, 2 * r + 4);
  }

  // Detection tag: pops in by day (like the light-mode tags), flickers on by night.
  function drawTag(x, y, r, label, now) {
    const t = reduceMotion ? 1e9 : now - startedAt - (night ? 1800 : 1200);
    if (t < 0) return;
    let alpha = 1, scale = 1;
    if (night) {
      const FLICKER = [1, 0.1, 0.9, 0.3, 1, 0.6];
      if (t < FLICKER.length * 70) alpha = FLICKER[Math.floor(t / 70)];
    } else if (t < 420) {
      const p = t / 420, c1 = 1.6, c3 = c1 + 1;
      const eased = 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2; // outBack, like the SVG tags
      scale = 1.3 - 0.3 * eased;
      alpha = Math.min(1, p * 2.5);
    }
    const s = 2 * r + 18, flag = night ? "#ff6a30" : "#ff5a1f", ink = night ? "#131613" : "#181b18";
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = (night ? 0.9 : 1) * alpha;
    if (night) { ctx.shadowColor = "rgba(255, 106, 48, 0.7)"; ctx.shadowBlur = 8; }
    ctx.strokeStyle = flag;
    ctx.lineWidth = night ? 1.6 : 2;
    ctx.strokeRect(-s / 2, -s / 2, s, s);
    ctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
    const cw = ctx.measureText(label).width + 10;
    ctx.fillStyle = flag;
    ctx.fillRect(-s / 2 - 0.8, -s / 2 - 17, cw, 17);
    ctx.shadowBlur = 0;
    ctx.fillStyle = ink;
    ctx.fillText(label, -s / 2 + 4.2, -s / 2 - 5);
    ctx.restore();
  }

  function drawOrb(now, scroll) {
    if (!orb) return;
    const { r } = orb;
    const x = orb.x + mx * 0.6 * 14;
    const y = orb.y - scroll * 0.4 + my * 0.6 * 10; // scrolls away slower than the page: feels far off
    if (y < -r * 4) return;
    if (night) drawMoon(x, y, r); else drawSun(x, y, r, now);
    drawTag(x, y, r, night ? "moon 0.97" : "sun 0.98", now);
  }

  /* ---------------- Frame loop ---------------- */

  function draw(now) {
    const dt = lastNow ? Math.min(now - lastNow, 100) : 16;
    lastNow = now;
    ctx.clearRect(0, 0, w, h);
    mx += (tmx - mx) * 0.04;
    my += (tmy - my) * 0.04;
    const scroll = window.scrollY;

    if (night) {
      drawStars(now, scroll);
      drawOrb(now, scroll);
      if (!reduceMotion) drawShooters(now);
    } else {
      drawClouds(dt, scroll);
      if (!reduceMotion) drawBirds(now, dt, scroll);
      drawOrb(now, scroll);
    }
  }

  function loop(now) {
    draw(now);
    raf = requestAnimationFrame(loop);
  }

  // React to theme changes and tab visibility.
  function update() {
    const nowNight = isDark();
    const themeChanged = nowNight !== night;
    night = nowNight;
    if (themeChanged) {
      sprites = {}; // the moon's disk uses the page background colour
      shooters = [];
      flocks = [];
    }
    if (themeChanged || !running) {
      startedAt = performance.now();
      nextShot = startedAt + 2500;
      nextFlock = startedAt + 3000;
    }
    const want = !document.hidden;
    if (want && !running) {
      running = true;
      lastNow = 0;
      layoutOrb();
      if (reduceMotion) draw(performance.now());
      else raf = requestAnimationFrame(loop);
    } else if (!want && running) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (running && themeChanged) {
      draw(performance.now()); // repaint right away so the theme switch never shows the old sky
    }
  }

  resize();
  update();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); layoutOrb(); if (running && reduceMotion) draw(performance.now()); }, 150);
  });
  // The name's size depends on the web font, so place the sun/moon again once fonts arrive.
  document.fonts?.ready.then(() => { layoutOrb(); if (running && reduceMotion) draw(performance.now()); });
  if (reduceMotion) window.addEventListener("scroll", () => running && draw(performance.now()), { passive: true });
  else window.addEventListener("pointermove", (e) => { tmx = e.clientX / w - 0.5; tmy = e.clientY / h - 0.5; }, { passive: true });

  document.addEventListener("visibilitychange", update);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", update);
  new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}
