import { createTimeline, stagger, utils } from "https://cdn.jsdelivr.net/npm/animejs@4.5.0/dist/bundles/anime.esm.min.js";
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

// An illustration panel (see figures.js). Empty string if the key is missing.
function figureMarkup(key) {
  const fig = figures[key];
  if (!fig) return "";
  return `<figure class="proj-fig">
      <svg class="illo" data-figure="${esc(key)}" role="img" aria-label="${esc(fig.label)}"></svg>
      <figcaption><span>${esc(fig.caption)}</span><button type="button" class="replay">${esc(fig.replayLabel || "Replay")}</button></figcaption>
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
    .map((s) => `<div><dt>${esc(s.group)}</dt><dd>${s.items.map(esc).join(", ")}</dd></div>`)
    .join("");

  const email = $("#contact-email");
  email.href = `mailto:${profile.email}`;
  email.textContent = profile.email;
  $("#contact-meta").innerHTML = `Code on <a href="${esc(profile.github)}" target="_blank" rel="noopener">GitHub</a>.`;
  $("#foot").textContent = `© ${new Date().getFullYear()} ${profile.name}`;
}

/* ------------------------------------------------------------------ */
/* Illustrations: draw now, animate once when scrolled into view       */
/* ------------------------------------------------------------------ */

function setupFigures() {
  document.querySelectorAll("svg.illo").forEach((svg) => {
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
setupFigures();

const topbar = $("#topbar");
const onScrollBar = () => topbar.classList.toggle("scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScrollBar, { passive: true });
onScrollBar();

// Page-load moment: the name sets itself letter by letter.
if (!reduceMotion) {
  utils.set("#name .char", { opacity: 0, translateY: "0.6em" });
  createTimeline({ defaults: { ease: "outExpo" } })
    .add("#name .char", { opacity: [0, 1], translateY: ["0.6em", 0], duration: 900, delay: stagger(28) }, 100)
    .add(".hero .intro, .hero .role, .hero .actions", { opacity: [0, 1], translateY: [12, 0], duration: 700, delay: stagger(90) }, 500);
}
