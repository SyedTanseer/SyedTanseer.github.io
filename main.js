import { animate, createTimeline, createDrawable, stagger, utils } from "https://cdn.jsdelivr.net/npm/animejs@4.5.0/dist/bundles/anime.esm.min.js";
import { profile, experience, projects, education, skills } from "./content.js";
import { figures } from "./figures.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (sel) => document.querySelector(sel);
const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

function renderName() {
  const words = profile.name.split(" ");
  const lines = words.length > 2 ? [words.slice(0, -1).join(" "), words.at(-1)] : [profile.name];
  $("#name").setAttribute("aria-label", profile.name);
  $("#name").innerHTML = lines
    .map(
      (line) =>
        `<span class="line" aria-hidden="true">${line
          .split(" ")
          .map((w) => `<span class="word">${[...w].map((ch) => `<span class="char">${esc(ch)}</span>`).join("")}</span>`)
          .join(" ")}</span>`
    )
    .join("");
}

function renderContent() {
  renderName();
  if (profile.status) $("#hud").innerHTML = `<span class="live">${esc(profile.status)}</span>`;
  else $("#hud").remove();
  $("#intro").textContent = profile.intro;
  $("#role").textContent = profile.role;

  $("#actions").innerHTML = `
    <a class="btn primary" href="#projects">See projects</a>
    <a class="btn" href="${esc(profile.github)}" target="_blank" rel="noopener">GitHub</a>
    <a class="btn" href="${esc(profile.resume)}" target="_blank" rel="noopener">Résumé (PDF)</a>`;

  $("#exp-list").innerHTML = experience
    .map(
      (e) => `
      <article class="entry">
        <div class="entry-head">
          <h3>${esc(e.org)}</h3>
          <span class="when">${esc(e.when)}</span>
        </div>
        <p class="sub">${esc(e.title)}, ${esc(e.place)}</p>
        <ul class="points">${e.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      </article>`
    )
    .join("");

  $("#proj-list").innerHTML = projects
    .map(
      (p) => `
      <article class="entry">
        <div class="entry-head">
          <h3>${esc(p.title)}</h3>
          ${p.when ? `<span class="when">${esc(p.when)}</span>` : ""}
        </div>
        ${
          figures[p.figure]
            ? `<figure class="proj-fig">
                 <svg class="illo" data-figure="${esc(p.figure)}" role="img" aria-label="${esc(figures[p.figure].label)}"></svg>
                 <figcaption><span>${esc(figures[p.figure].caption)}</span><button type="button" class="replay">Replay</button></figcaption>
               </figure>`
            : ""
        }
        <div class="proj-body">
          <div>
            ${p.summary ? `<p class="summary">${esc(p.summary)}</p>` : ""}
            ${p.points?.length ? `<ul class="points">${p.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
          </div>
          <div class="proj-side">
            ${
              p.stack?.length
                ? `<p class="side-label">Built with</p><ul class="stack">${p.stack.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>`
                : ""
            }
            ${
              p.links?.length
                ? `<p class="links">${p.links
                    .map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`)
                    .join("")}</p>`
                : ""
            }
          </div>
        </div>
      </article>`
    )
    .join("");

  $("#edu-list").innerHTML = education
    .map(
      (e) => `
      <div class="edu">
        <h3>${esc(e.school)}</h3>
        <p>${esc(e.detail)}, ${esc(e.when)}</p>
        <p class="score">${esc(e.score)}</p>
      </div>`
    )
    .join("");

  $("#skill-list").innerHTML = skills
    .map((s) => `<div><dt>${esc(s.group)}</dt><dd>${s.items.map(esc).join(", ")}</dd></div>`)
    .join("");

  const email = $("#contact-email");
  email.href = `mailto:${profile.email}`;
  email.textContent = profile.email;
  $("#contact-meta").innerHTML = `Code on <a href="${esc(profile.github)}" target="_blank" rel="noopener">GitHub</a>.`;
  $("#foot").textContent = `© ${new Date().getFullYear()} ${profile.name}`;
}

/* ------------------------------------------------------------------ */
/* Engine drawing                                                      */
/* ------------------------------------------------------------------ */

const C = 250;
const pt = (r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [+(C + r * Math.sin(a)).toFixed(2), +(C - r * Math.cos(a)).toFixed(2)];
};
const P = (r, deg) => pt(r, deg).join(" ");

const BLADES = 20;
const STEP = 360 / BLADES;

function bladePath(a) {
  // A swept fan blade: narrow at the root, wide and twisted at the tip.
  return [
    `M ${P(48, a)}`,
    `Q ${P(125, a - 3)} ${P(198, a + 6)}`,
    `A 198 198 0 0 1 ${P(198, a + 19)}`,
    `Q ${P(125, a + 13)} ${P(48, a + 11)}`,
    `A 48 48 0 0 0 ${P(48, a)} Z`,
  ].join(" ");
}

// Inspection boxes (positions assume the fan stops at 0°).
const DETECTIONS = [
  { label: "tip_erosion 0.91", x: 350, y: 66, w: 78, h: 82 },
  { label: "edge_nick 0.84", x: 86, y: 330, w: 66, h: 60 },
  { label: "spinner_ok 0.97", x: 198, y: 198, w: 104, h: 104 },
  { label: "liner_dent 0.78", x: 26, y: 112, w: 60, h: 66 },
];

function buildEngine() {
  const svg = $("#engine");
  const blades = Array.from({ length: BLADES }, (_, i) => `<path class="draw blade" d="${bladePath(i * STEP)}"/>`).join("");

  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = i * 5;
    const len = i % 6 === 0 ? 9 : 4;
    return `<line class="draw faint" x1="${pt(214, a)[0]}" y1="${pt(214, a)[1]}" x2="${pt(214 + len, a)[0]}" y2="${pt(214 + len, a)[1]}"/>`;
  }).join("");

  const boxes = DETECTIONS.map((d) => {
    const chipW = d.label.length * 7.9 + 14;
    const chipY = d.y - 22;
    return `
      <g class="box" aria-hidden="true">
        <rect class="frame" x="${d.x}" y="${d.y}" width="${d.w}" height="${d.h}"/>
        <rect class="chip" x="${d.x - 1.5}" y="${chipY}" width="${chipW}" height="22"/>
        <text x="${d.x + 6}" y="${chipY + 15.5}">${d.label}</text>
      </g>`;
  }).join("");

  svg.innerHTML = `
    <g id="casing">
      <circle class="draw thick" cx="${C}" cy="${C}" r="236"/>
      <circle class="draw" cx="${C}" cy="${C}" r="226"/>
      <circle class="draw faint" cx="${C}" cy="${C}" r="204"/>
    </g>
    <g id="ticks">${ticks}</g>
    <g id="fan" style="transform-box: view-box; transform-origin: ${C}px ${C}px">
      ${blades}
      <circle class="draw thick hubfill" cx="${C}" cy="${C}" r="48"/>
      <circle class="draw" cx="${C}" cy="${C}" r="24"/>
      <path class="draw" d="M ${C} ${C - 24} Q ${C + 30} ${C - 6} ${C + 16} ${C + 20}"/>
    </g>
    <line class="sweep" id="sweep" x1="0" y1="0" x2="500" y2="0"/>
    <g id="boxes">${boxes}</g>`;

  // Boxes scale from their own centre.
  svg.querySelectorAll(".box").forEach((g) => {
    g.style.transformBox = "fill-box";
    g.style.transformOrigin = "center";
  });
}

/* ------------------------------------------------------------------ */
/* Motion                                                              */
/* ------------------------------------------------------------------ */

function showFinalState() {
  utils.set("#name .char", { opacity: 1, translateY: 0 });
  utils.set("#boxes .box", { opacity: 1, scale: 1 });
}

function scanSequence(tl, at = 0) {
  return tl
    .add("#fan", { rotate: [0, 1080], duration: 3000, ease: "outQuart" }, at)
    .add("#sweep", { y1: [10, 490], y2: [10, 490], opacity: [{ to: 0.9, duration: 120 }, { to: 0, delay: 620, duration: 160 }], duration: 900, ease: "inOutSine" }, `-=500`)
    .add("#boxes .box", { opacity: [0, 1], scale: [1.35, 1], duration: 420, ease: "outBack(1.6)", delay: stagger(140) }, "-=250");
}

function intro() {
  utils.set("#boxes .box", { opacity: 0 });
  utils.set("#name .char", { opacity: 0, translateY: "0.6em" });
  utils.set("#fan .blade", { opacity: 0 });

  const lines = createDrawable("#casing .draw, #fan .draw:not(.blade), #ticks .draw");
  const tl = createTimeline({ defaults: { ease: "outExpo" } });

  tl.add("#name .char", { opacity: [0, 1], translateY: ["0.6em", 0], duration: 900, delay: stagger(28) }, 0)
    .add(lines, { draw: ["0 0", "0 1"], duration: 1300, ease: "inOutQuad", delay: stagger(6) }, 150)
    .add("#fan .blade", { opacity: [0, 1], duration: 500, delay: stagger(25) }, 650);

  scanSequence(tl, 900);
}

function rescan() {
  const btn = $("#rescan");
  if (reduceMotion) return;
  btn.disabled = true;
  const tl = createTimeline({ onComplete: () => (btn.disabled = false) });
  tl.add("#boxes .box", { opacity: 0, duration: 200, ease: "outQuad" });
  scanSequence(tl, 200);
}

/* ------------------------------------------------------------------ */
/* Project illustrations: draw now, animate once when scrolled into view */
/* ------------------------------------------------------------------ */

function setupFigures() {
  const svgs = [...document.querySelectorAll("svg.illo")];
  svgs.forEach((svg) => {
    const fig = figures[svg.dataset.figure];
    fig.build(svg);
    const btn = svg.closest("figure").querySelector(".replay");

    if (reduceMotion) {
      fig.rest?.(svg);
      btn.hidden = true;
      return;
    }

    const play = () => {
      btn.disabled = true;
      fig.play(svg).then(() => {
        btn.disabled = false;
        fig.rest?.(svg);
      });
    };
    btn.addEventListener("click", play);

    if (!("IntersectionObserver" in window)) return fig.rest?.(svg);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          play();
        }
      },
      { threshold: 0.45 }
    );
    io.observe(svg);
  });
}

/* ------------------------------------------------------------------ */

renderContent();
buildEngine();
setupFigures();

const topbar = $("#topbar");
const onScrollBar = () => topbar.classList.toggle("scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScrollBar, { passive: true });
onScrollBar();

if (reduceMotion) {
  showFinalState();
  $("#rescan").hidden = true;
} else {
  intro();
  $("#rescan").addEventListener("click", rescan);
}
