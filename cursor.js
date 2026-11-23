// Custom cursor, drawn on one canvas over the page. It changes with the theme:
//   day   - a paper plane whose nose is the pointer. It banks into the direction you move,
//           leaves a dashed contrail, and settles back to pointing up-left when you stop.
//   night - a comet: a glowing head with a tail of twinkling stardust; clicks burst into sparks.
// Over anything clickable the plane turns orange / the comet gets a pulsing halo.
// Mouse/trackpad only; touch keeps the default. Reduced motion drops the trails and bursts.

const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const CLICKABLE = "a, button, [data-cursor]";
const PARK = Math.atan2(-1, -1); // resting heading: nose up-left, like a normal arrow

const dark = () => getComputedStyle(document.documentElement).colorScheme.includes("dark");

export function setupCursor() {
  if (!fine.matches) return;

  const cv = document.createElement("canvas");
  cv.id = "cursor";
  cv.setAttribute("aria-hidden", "true");
  document.body.append(cv);
  document.documentElement.classList.add("has-cursor");
  const ctx = cv.getContext("2d");

  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  let night = dark();
  let px = -100, py = -100, lx = -100, ly = -100; // pointer, and where it was last frame
  let vx = 0, vy = 0;                              // smoothed velocity (px/frame)
  let heading = PARK, lastMove = 0;
  let visible = false, hovering = false, raf = 0;
  let pop = 1;                                     // plane scale, dips on click
  let trail = [];                                  // recent positions {x, y, t}
  let dust = [];                                   // particles {x, y, vx, vy, life, max, r, c, s}
  let ripples = [];                                // day click rings {x, y, t, hot}

  const watchTheme = () => {
    const n = dark();
    if (n !== night) { night = n; trail = []; dust = []; ripples = []; }
  };
  new MutationObserver(watchTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", watchTheme);

  // ---------- day: paper plane ----------
  function drawPlane(now) {
    // contrail: dashes that fade out behind the tail
    if (trail.length > 1) {
      ctx.setLineDash([3, 5]);
      ctx.lineWidth = 1.4;
      ctx.lineCap = "round";
      let run = 0;
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1], b = trail[i];
        const age = (now - b.t) / 700;
        ctx.strokeStyle = `rgba(24, 27, 24, ${0.5 * (1 - age)})`;
        ctx.lineDashOffset = -run;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        run += Math.hypot(b.x - a.x, b.y - a.y);
      }
      ctx.setLineDash([]);
    }

    for (const r of ripples) {
      const k = (now - r.t) / 500;
      ctx.strokeStyle = r.hot ? `rgba(255, 90, 31, ${1 - k})` : `rgba(24, 27, 24, ${0.6 * (1 - k)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(r.x, r.y, 4 + 22 * Math.sqrt(k), 0, Math.PI * 2); ctx.stroke();
    }

    if (!visible) return;

    if (hovering) { // slow dashed sight ring around the nose
      ctx.save();
      ctx.translate(px, py); ctx.rotate(now / 900);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(255, 90, 31, 0.9)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(heading);
    ctx.scale(pop, pop);
    ctx.lineJoin = "round";
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = "#181b18";
    // upper wing
    ctx.fillStyle = hovering ? "#ff5a1f" : "#f7f8f4";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-22, -9); ctx.lineTo(-15, 1); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // keel / lower fold, in shade
    ctx.fillStyle = hovering ? "#c8410f" : "#c9cec4";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-15, 1); ctx.lineTo(-19, 8); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // ---------- night: comet ----------
  const COLORS = ["255, 255, 255", "200, 220, 255", "255, 170, 110", "255, 106, 48"];
  function spark(x, y, vxi, vyi, max, r) {
    dust.push({ x, y, vx: vxi, vy: vyi, life: 0, max, r, c: COLORS[(Math.random() * COLORS.length) | 0], s: Math.random() * 6.28 });
  }
  function star(x, y, r) { // four-point glint
    ctx.beginPath();
    ctx.moveTo(x, y - r * 2.4); ctx.quadraticCurveTo(x, y, x + r * 2.4, y);
    ctx.quadraticCurveTo(x, y, x, y + r * 2.4); ctx.quadraticCurveTo(x, y, x - r * 2.4, y);
    ctx.quadraticCurveTo(x, y, x, y - r * 2.4);
    ctx.fill();
  }
  function drawComet(now) {
    ctx.globalCompositeOperation = "lighter";

    // tail: a tapering streak through recent positions
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1], b = trail[i];
      const k = 1 - (now - b.t) / 300;
      if (k <= 0) continue;
      ctx.strokeStyle = `rgba(${i > trail.length - 4 ? "255, 240, 225" : "255, 140, 80"}, ${0.55 * k})`;
      ctx.lineWidth = 5 * k;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }

    for (const d of dust) {
      const k = 1 - d.life / d.max;
      const tw = 0.55 + 0.45 * Math.sin(d.s + now / 70);
      ctx.fillStyle = `rgba(${d.c}, ${k * tw})`;
      if (d.r > 1.3) star(d.x, d.y, d.r * k);
      else { ctx.beginPath(); ctx.arc(d.x, d.y, d.r * (0.4 + 0.6 * k), 0, Math.PI * 2); ctx.fill(); }
    }

    if (visible) {
      const R = hovering ? 22 : 16;
      const g = ctx.createRadialGradient(px, py, 0, px, py, R);
      g.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      g.addColorStop(0.18, hovering ? "rgba(255, 150, 90, 0.7)" : "rgba(200, 220, 255, 0.55)");
      g.addColorStop(1, "rgba(255, 106, 48, 0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(px, py, R, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(px, py, 2.4, 0, Math.PI * 2); ctx.fill();

      if (hovering) { // pulsing halo
        const r = 15 + Math.sin(now / 180) * 2;
        ctx.strokeStyle = "rgba(255, 106, 48, 0.85)";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "rgba(255, 106, 48, 0.9)";
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }

  // ---------- loop ----------
  function frame(now) {
    const dx = px - lx, dy = py - ly;
    lx = px; ly = py;
    vx += (dx - vx) * 0.3; vy += (dy - vy) * 0.3;
    const speed = Math.hypot(vx, vy);

    if (!reduceMotion && visible) {
      if (night) {
        trail.push({ x: px, y: py, t: now });
        const n = Math.min(5, speed / 5);
        for (let i = 0; i < n || (i === 0 && Math.random() < 0.08); i++) { // a little dust even at rest
          spark(px + (Math.random() - 0.5) * 6, py + (Math.random() - 0.5) * 6,
            -vx * 0.06 + (Math.random() - 0.5) * 0.6, -vy * 0.06 + (Math.random() - 0.5) * 0.6 + 0.05,
            500 + Math.random() * 700, 0.6 + Math.random() * 1.4);
        }
      } else if (speed > 0.4 || trail.length) {
        const tail = 18 * pop;
        trail.push({ x: px - Math.cos(heading) * tail, y: py - Math.sin(heading) * tail, t: now });
      }
    }

    // plane heading: bank into the motion, drift back to the arrow pose when still
    if (!reduceMotion) {
      if (speed > 1.2) { heading = turn(heading, Math.atan2(vy, vx), 0.18); lastMove = now; }
      else if (now - lastMove > 500) heading = turn(heading, PARK, 0.06);
    }
    pop += (1 - pop) * 0.2;

    const life = night ? 300 : 700;
    while (trail.length && now - trail[0].t > life) trail.shift();
    if (trail.length > 60) trail.splice(0, trail.length - 60);
    const dt = 16.7;
    dust = dust.filter((d) => {
      d.life += dt; d.x += d.vx; d.y += d.vy; d.vx *= 0.96; d.vy *= 0.96;
      return d.life < d.max;
    });
    ripples = ripples.filter((r) => now - r.t < 500);

    ctx.clearRect(0, 0, W, H);
    night ? drawComet(now) : drawPlane(now);

    const busy = visible || trail.length || dust.length || ripples.length;
    raf = busy && !document.hidden ? requestAnimationFrame(frame) : 0;
  }
  const kick = () => { if (!raf && !document.hidden) raf = requestAnimationFrame(frame); };

  function turn(a, b, k) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * k;
  }

  const hoverAt = (el) => { hovering = !!el?.closest?.(CLICKABLE); };

  // Coming back into the window: start fresh at the new spot. Without this the cursor would
  // flash at the point where it left, then streak across the screen with a huge "velocity".
  function arrive(e) {
    px = lx = e.clientX; py = ly = e.clientY;
    vx = vy = 0;
    trail = [];
    visible = true;
  }

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    if (!visible) arrive(e);
    px = e.clientX; py = e.clientY;
    hoverAt(e.target);
    kick();
  }, { passive: true });

  document.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    pop = 0.78;
    if (reduceMotion) return kick();
    if (night) {
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2 + Math.random() * 0.2, s = 1.5 + Math.random() * 3.5;
        spark(px, py, Math.cos(a) * s, Math.sin(a) * s, 450 + Math.random() * 500, 0.8 + Math.random() * 1.6);
      }
    } else {
      ripples.push({ x: px, y: py, t: performance.now(), hot: hovering });
    }
    kick();
  });
  document.documentElement.addEventListener("pointerleave", () => { visible = false; kick(); });
  document.documentElement.addEventListener("pointerenter", (e) => {
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    arrive(e); hoverAt(e.target); kick();
  });
  document.addEventListener("visibilitychange", kick);

  // Scrolling moves content under a still pointer: re-check what it's over.
  window.addEventListener("scroll", () => {
    if (visible) { hoverAt(document.elementFromPoint(px, py)); kick(); }
  }, { passive: true });
}
