// Custom cursor: an orange dot with viewfinder corners that trail behind it.
// Over anything clickable the corners snap out to frame it, like a detection box,
// with a tag naming it ("résumé 0.97"). Mouse/trackpad only; touch keeps the default.

const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const CLICKABLE = "a, button, [data-cursor]";

// What the tag says for each kind of element.
function labelFor(el) {
  if (el.dataset.cursor) return el.dataset.cursor;
  if (el.id === "theme-toggle") return "theme";
  if (el.classList.contains("replay")) return "replay";
  const href = el.getAttribute("href") || "";
  if (href.startsWith("mailto:")) return "email";
  if (href.endsWith(".pdf")) return "résumé";
  if (href.includes("github.com")) return "github";
  if (href.startsWith("#")) return "jump";
  if (el.tagName === "A") return "link";
  return "button";
}

// A stable, made-up confidence score per label, in the style of the site's tags.
function scoreFor(label) {
  let h = 0;
  for (const ch of label) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (0.9 + (h % 10) / 100).toFixed(2);
}

export function setupCursor() {
  if (!fine.matches) return;

  const root = document.createElement("div");
  root.id = "cursor";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <div class="cur-frame"><i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i><span class="cur-chip"></span></div>
    <div class="cur-dot"></div>`;
  document.body.append(root);
  document.documentElement.classList.add("has-cursor");

  const frame = root.querySelector(".cur-frame");
  const chip = root.querySelector(".cur-chip");
  const dot = root.querySelector(".cur-dot");

  const IDLE = 30; // size of the corner frame when not over anything
  let px = -100, py = -100;                                   // pointer
  let fx = -100, fy = -100, fw = IDLE, fh = IDLE;             // frame (eased)
  let target = null, pressed = false, visible = false, raf = 0;

  function goal() {
    if (target && target.isConnected) {
      const r = target.getBoundingClientRect();
      const pad = 6;
      return { x: r.left - pad, y: r.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 };
    }
    const s = pressed ? IDLE * 0.7 : IDLE;
    return { x: px - s / 2, y: py - s / 2, w: s, h: s };
  }

  function frameStep() {
    const g = goal();
    const k = reduceMotion ? 1 : target ? 0.28 : 0.22;
    fx += (g.x - fx) * k; fy += (g.y - fy) * k;
    fw += (g.w - fw) * k; fh += (g.h - fh) * k;
    const squeeze = pressed && target ? 0.94 : 1;
    frame.style.transform = `translate(${fx}px, ${fy}px) scale(${squeeze})`;
    frame.style.width = `${fw}px`;
    frame.style.height = `${fh}px`;
    dot.style.transform = `translate(${px}px, ${py}px)`;
    root.classList.toggle("chip-below", fy < 26); // near the top edge the tag would be cut off: put it underneath
    const settled = Math.abs(g.x - fx) + Math.abs(g.y - fy) + Math.abs(g.w - fw) + Math.abs(g.h - fh) < 0.3;
    raf = settled && !target ? 0 : requestAnimationFrame(frameStep); // keep tracking a hovered element while it scrolls
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frameStep); };

  function setTarget(el) {
    if (el === target) return;
    target = el;
    root.classList.toggle("on-target", !!el);
    if (el) {
      const label = labelFor(el);
      chip.textContent = `${label} ${scoreFor(label)}`;
    }
    kick();
  }

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    px = e.clientX; py = e.clientY;
    if (!visible) {
      visible = true;
      root.classList.add("visible");
      if (fx < -50) { fx = px - IDLE / 2; fy = py - IDLE / 2; } // first move: start at the pointer
    }
    setTarget(e.target.closest?.(CLICKABLE) || null);
    kick();
  }, { passive: true });

  document.addEventListener("pointerdown", () => { pressed = true; root.classList.add("pressed"); kick(); });
  document.addEventListener("pointerup", () => { pressed = false; root.classList.remove("pressed"); kick(); });
  document.documentElement.addEventListener("pointerleave", () => { visible = false; root.classList.remove("visible"); });
  document.documentElement.addEventListener("pointerenter", () => { visible = true; root.classList.add("visible"); });

  // Scrolling moves content under a still pointer: re-check what it's over.
  window.addEventListener("scroll", () => {
    if (!visible) return;
    const el = document.elementFromPoint(px, py);
    setTarget(el?.closest?.(CLICKABLE) || null);
    kick();
  }, { passive: true });
}
