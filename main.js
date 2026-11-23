import { animate, createTimeline, stagger, utils } from "https://cdn.jsdelivr.net/npm/animejs@4.5.0/dist/bundles/anime.esm.min.js";
import { profile, experience, projects, education, skills, languages } from "./content.js";
import { figures, isDark } from "./figures.js";
import { buildPerson, playPerson } from "./person.js";
import { glyphFor, primeGlyph } from "./glyphs.js";
import { setupSky } from "./sky.js";
import { setupCursor } from "./cursor.js";

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

// An illustration panel (see figures.js). Empty string if the key is missing.
function figureMarkup(key) {
  const fig = figures[key];
  if (!fig) return "";
  return `<figure class="proj-fig">
      <svg class="illo" data-figure="${esc(key)}" role="img" aria-label="${esc(fig.label)}"></svg>
      <figcaption><span>${esc(fig.caption)}</span></figcaption>
    </figure>`;
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
      <article class="entry ${figures[e.figure] ? "exp-with-fig" : ""}">
        <div class="exp-text">
          <div class="entry-head">
            <h3>${esc(e.org)}</h3>
            <span class="when">${esc(e.when)}</span>
          </div>
          <p class="sub">${esc(e.title)}, ${esc(e.place)}</p>
          <ul class="points">${e.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        </div>
        ${figureMarkup(e.figure)}
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
        ${figureMarkup(p.figure)}
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
    .map(
      (s) => `<div><dt>${esc(s.group)}</dt><dd><ul class="chips">${s.items
        .map((it) => `<li class="chip" data-skill="${esc(it)}"><svg class="glyph" viewBox="0 0 32 32" aria-hidden="true">${glyphFor(it).svg}</svg><span>${esc(it)}</span></li>`)
        .join("")}</ul></dd></div>`
    )
    .join("");

  // Greetings are split into grapheme clusters so Devanagari vowel signs stay attached.
  const seg = "Segmenter" in Intl ? new Intl.Segmenter() : null;
  const graphemes = (s) => (seg ? [...seg.segment(s)].map((x) => x.segment) : [...s]);
  $("#lang-list").innerHTML = `<p class="side-label">Spoken</p>` + languages
    .map(
      (l) => `
      <div class="lang" style="--level:${l.level}">
        <span class="greet" lang="${esc(l.lang)}" aria-hidden="true">${graphemes(l.greeting).map((g) => `<span class="g">${esc(g)}</span>`).join("")}</span>
        <span class="lang-name">${esc(l.name)}</span>
        <span class="lang-note">${esc(l.note)}</span>
        <span class="meter" aria-hidden="true"><span class="fill"></span></span>
      </div>`
    )
    .join("");

  const email = $("#contact-email");
  email.href = `mailto:${profile.email}`;
  email.textContent = profile.email;
  $("#contact-meta").innerHTML = `Code on <a href="${esc(profile.github)}" target="_blank" rel="noopener">GitHub</a>.`;
  $("#foot").textContent = `© ${new Date().getFullYear()} ${profile.name}`;
}

/* ------------------------------------------------------------------ */
/* Looping: everything replays on a cycle, but only while it's on screen */
/* ------------------------------------------------------------------ */

// Tracks which elements are on screen; `whenVisible(el)` resolves once el is (or already is).
const shown = new Set();
const waiters = new Map();
const seen = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        shown.add(e.target);
        (waiters.get(e.target) || []).forEach((fn) => fn());
        waiters.delete(e.target);
      } else shown.delete(e.target);
    }), { threshold: 0.3 })
  : null;
const watch = (el) => seen?.observe(el);
const whenVisible = (el) =>
  !seen || shown.has(el) ? Promise.resolve() : new Promise((res) => waiters.set(el, [...(waiters.get(el) || []), res]));
const wait = (ms) => new Promise((res) => setTimeout(res, ms));
// Also wait while the tab is in the background, so loops don't pile up.
const tabVisible = () => document.hidden ? new Promise((res) => document.addEventListener("visibilitychange", function f() {
  if (!document.hidden) { document.removeEventListener("visibilitychange", f); res(); }
})) : Promise.resolve();

/* ------------------------------------------------------------------ */
/* Illustrations: play, hold, fade out, play again, forever             */
/* ------------------------------------------------------------------ */

const HOLD = 2600, FADE = 450;
const restarters = new Map(); // svg -> () => restart now (used by the theme switch)

function setupFigures() {
  document.querySelectorAll("svg.illo").forEach((svg) => {
    const fig = figures[svg.dataset.figure];
    fig.build(svg);
    if (reduceMotion) return fig.rest?.(svg);
    watch(svg);
    if (seen) svg.style.opacity = 0; // hidden until its first run draws it in

    let run = 0; // bumped to cancel a pending cycle
    async function cycle(id) {
      await whenVisible(svg);
      while (id === run) {
        await tabVisible();
        const tl = fig.play(svg);
        requestAnimationFrame(() => (svg.style.opacity = 1)); // show it once the first frame (blank) has rendered
        await tl;
        if (id !== run) return;
        fig.rest?.(svg);
        await wait(HOLD);
        await whenVisible(svg);
        await tabVisible();
        if (id !== run) return;
        await animate(svg, { opacity: [1, 0], duration: FADE, ease: "inQuad" });
      }
    }
    restarters.set(svg, async () => {
      const id = ++run;
      await animate(svg, { opacity: 0, duration: 200, ease: "inQuad" });
      if (id === run) cycle(id);
    });
    cycle(run);
  });
}

/* ------------------------------------------------------------------ */
/* Languages: each greeting writes itself, then the fluency bars fill   */
/* ------------------------------------------------------------------ */

function setupLanguages() {
  const box = $("#lang-list");
  if (reduceMotion || !("IntersectionObserver" in window)) return;
  utils.set("#lang-list .g", { opacity: 0, translateY: "0.5em" });
  utils.set("#lang-list .fill", { scaleX: 0 });

  const play = () => {
    const tl = createTimeline({ defaults: { ease: "outExpo" } });
    box.querySelectorAll(".lang").forEach((row, i) => {
      tl.add(row.querySelectorAll(".g"), { opacity: [0, 1], translateY: ["0.5em", 0], duration: 600, delay: stagger(90) }, i * 420)
        .add(row.querySelector(".fill"), { scaleX: [0, 1], duration: 900, ease: "outQuart" }, i * 420 + 250);
    });
  };
  const rows = [...box.querySelectorAll(".lang")];
  const rewrite = (row) =>
    createTimeline()
      .add(row.querySelectorAll(".g"), { opacity: [1, 0], translateY: [0, "-0.4em"], duration: 260, delay: stagger(30), ease: "inQuad" })
      .add(row.querySelectorAll(".g"), { opacity: [0, 1], translateY: ["0.5em", 0], duration: 600, delay: stagger(90), ease: "outExpo" })
      .add(row.querySelector(".fill"), { scaleX: [1, 0.15, 1], duration: 1100, ease: "inOutQuart" }, 0);
  watch(box);
  (async () => {
    await whenVisible(box);
    play();
    await wait(rows.length * 420 + 2500);
    for (let i = 0; ; i = (i + 1) % rows.length) { // then rewrite them one by one, round and round
      await whenVisible(box); await tabVisible();
      await rewrite(rows[i]);
      await wait(1600);
    }
  })();

  // Hovering a language writes its greeting again.
  box.querySelectorAll(".lang").forEach((row) =>
    row.addEventListener("pointerenter", () =>
      animate(row.querySelectorAll(".g"), { opacity: [0, 1], translateY: ["0.5em", 0], duration: 500, delay: stagger(70), ease: "outExpo" })
    )
  );
}

/* ------------------------------------------------------------------ */
/* Skills: each chip appears and its icon does its little motion         */
/* ------------------------------------------------------------------ */

function setupSkills() {
  const chips = [...document.querySelectorAll("#skill-list .chip")];
  chips.forEach((chip) => primeGlyph(chip.querySelector(".glyph"), glyphFor(chip.dataset.skill)));
  if (reduceMotion || !("IntersectionObserver" in window)) return;

  const playChip = (chip) => glyphFor(chip.dataset.skill).play(chip.querySelector(".glyph"));
  utils.set(chips, { opacity: 0, translateY: 10 });

  const list = $("#skill-list");
  watch(list);
  (async () => {
    await whenVisible(list);
    animate(chips, { opacity: [0, 1], translateY: [10, 0], duration: 500, delay: stagger(70), ease: "outExpo" });
    chips.forEach((chip, i) => setTimeout(() => playChip(chip), 120 + i * 70));
    await wait(120 + chips.length * 70 + 1800);
    for (let i = 0; ; i = (i + 1) % chips.length) { // then the icons take turns, one after another
      await whenVisible(list); await tabVisible();
      playChip(chips[i]);
      animate(chips[i], { translateY: [0, -3, 0], duration: 500, ease: "inOutSine" });
      await wait(650);
    }
  })();

  // Hovering a chip plays its motion again.
  chips.forEach((chip) => chip.addEventListener("pointerenter", () => playChip(chip)));
}

/* ------------------------------------------------------------------ */

renderContent();
setupLanguages();
setupSkills();
setupFigures();
buildPerson($("#buddy"));

/* ------------------------------------------------------------------ */
/* Theme toggle: follows the OS until the visitor picks one, then remembers it */
/* ------------------------------------------------------------------ */

function setupThemeToggle() {
  const btn = $("#theme-toggle");
  const root = document.documentElement;
  const sync = () => btn.setAttribute("aria-label", isDark() ? "Switch to light theme" : "Switch to dark theme");

  const apply = (next) => {
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) { /* private mode: choice lasts this visit only */ }
    sync();
  };

  btn.addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    if (reduceMotion || !document.startViewTransition) return apply(next);

    // The new theme opens as a circle growing out of the toggle button.
    const r = btn.getBoundingClientRect();
    root.style.setProperty("--vt-x", `${r.left + r.width / 2}px`);
    root.style.setProperty("--vt-y", `${r.top + r.height / 2}px`);
    const vt = document.startViewTransition(() => apply(next));

    // Going dark: drawings on screen boot up again in HUD style.
    if (next === "dark") vt.finished.then(() => restarters.forEach((restart, svg) => shown.has(svg) && restart()));
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", sync);
  sync();
}
setupThemeToggle();
setupSky();
setupCursor();

const topbar = $("#topbar");
const onScrollBar = () => topbar.classList.toggle("scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScrollBar, { passive: true });
onScrollBar();

// Page-load moment: the name sets itself letter by letter.
if (!reduceMotion) {
  // Light: letters rise into place. Dark: they flicker on like a neon sign, from the middle out.
  const nameIn = isDark()
    ? {
        opacity: [
          { to: 1, duration: 50 }, { to: 0.15, duration: 70 }, { to: 0.85, duration: 50 },
          { to: 0.3, duration: 110 }, { to: 1, duration: 60 }, { to: 0.6, duration: 60 }, { to: 1, duration: 300 },
        ],
        ease: "linear",
        delay: stagger(45, { from: "center" }),
      }
    : { opacity: [0, 1], translateY: ["0.6em", 0], duration: 900, delay: stagger(28) };
  utils.set("#name .char", isDark() ? { opacity: 0 } : { opacity: 0, translateY: "0.6em" });
  createTimeline({ defaults: { ease: "outExpo" } })
    .add("#name .char", nameIn, 100)
    .add(".hero .intro, .hero .role, .hero .actions", { opacity: [0, 1], translateY: [12, 0], duration: 700, delay: stagger(90) }, 500);
  playPerson($("#buddy"), 600);

  // Then every few seconds a pass runs through the name: a wave by day, a neon stutter by night.
  const hero = $("#name");
  watch(hero);
  (async () => {
    await wait(5000);
    for (;;) {
      await whenVisible(hero); await tabVisible();
      const chars = hero.querySelectorAll(".char");
      if (isDark()) {
        const pick = [...chars].filter(() => Math.random() < 0.3);
        await animate(pick, {
          opacity: [{ to: 0.2, duration: 60 }, { to: 1, duration: 50 }, { to: 0.4, duration: 80 }, { to: 1, duration: 120 }],
          ease: "linear", delay: stagger(40),
        });
      } else {
        await animate(chars, { translateY: [0, "-0.12em", 0], duration: 700, delay: stagger(35), ease: "inOutSine" });
      }
      await wait(5500);
    }
  })();
}
