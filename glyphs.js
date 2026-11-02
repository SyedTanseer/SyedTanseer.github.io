// Small animated icons for each skill and tool (32×32 line drawings).
// Each glyph is { svg: markup, play(el) } — `play` runs its little motion.
// These are drawings of what each thing does, not the tools' logos.
// Classes: .k = ink line, .a = orange line, .fa = orange fill, .fk = ink fill.

import { animate, createTimeline, stagger, steps } from "https://cdn.jsdelivr.net/npm/animejs@4.5.0/dist/bundles/anime.esm.min.js";

const q = (el, s) => el.querySelectorAll(s);
// Theme colours, read once from the CSS variables.
let _c;
const C = () => {
  if (_c) return _c;
  const css = getComputedStyle(document.documentElement);
  const v = (n) => css.getPropertyValue(n).trim();
  return (_c = { flag: v("--flag"), line: v("--line"), panel: v("--panel-bg") || v("--bg") });
};
const pop = (targets, delay = 70) =>
  animate(targets, { scale: [0, 1], opacity: [0, 1], duration: 380, delay: stagger(delay), ease: "outBack(2.2)" });

export const GLYPHS = {
  /* ---------- Programming ---------- */
  Python: {
    // an interactive prompt: >>> and a blinking cursor
    svg: `<path class="k chev" d="M4 11 l5 5 l-5 5"/><path class="k chev" d="M10 11 l5 5 l-5 5"/><path class="a chev" d="M16 11 l5 5 l-5 5"/>
          <rect class="fa caret" x="23" y="19.5" width="6" height="2.6"/>`,
    play: (el) => {
      pop(q(el, ".chev"), 90);
      animate(q(el, ".caret"), { opacity: [{ to: 0, duration: 1 }, { to: 1, duration: 160, delay: 260 }, { to: 0, duration: 160, delay: 200 }, { to: 1, duration: 160, delay: 200 }], ease: steps(1) });
    },
  },
  Java: {
    // class braces closing in around a body
    svg: `<path class="k lb" d="M12 5 q-4 0 -4 4 v3.5 q0 3.5 -3 3.5 q3 0 3 3.5 v3.5 q0 4 4 4"/>
          <path class="k rb" d="M20 5 q4 0 4 4 v3.5 q0 3.5 3 3.5 q-3 0 -3 3.5 v3.5 q0 4 -4 4"/>
          <circle class="fa dot" cx="16" cy="16" r="2.6"/>`,
    play: (el) => {
      animate(q(el, ".lb"), { translateX: [-5, 0], duration: 500, ease: "outBack(2)" });
      animate(q(el, ".rb"), { translateX: [5, 0], duration: 500, ease: "outBack(2)" });
      pop(q(el, ".dot"));
    },
  },
  C: {
    // a pointer: an arrow reaching a memory cell
    svg: `<circle class="fa src" cx="5.5" cy="16" r="2.6"/><path class="a arrow" d="M9 16 H18 M15 12.5 L18.5 16 L15 19.5"/>
          <rect class="k cell" x="20" y="10" width="9" height="12"/><path class="k" d="M20 16 H29"/>`,
    play: (el) => {
      animate(q(el, ".arrow"), { translateX: [-6, 0], opacity: [0, 1], duration: 450, ease: "outExpo" });
      animate(q(el, ".cell"), { fill: ["rgba(255,90,31,0.45)", "rgba(255,90,31,0)"], duration: 700, delay: 350, ease: "outQuad" });
    },
  },

  /* ---------- Areas ---------- */
  "Machine learning": {
    // a line fitting itself to scattered points
    svg: `<circle class="fk pt" cx="6" cy="24" r="1.9"/><circle class="fk pt" cx="11" cy="18" r="1.9"/><circle class="fk pt" cx="15" cy="19" r="1.9"/>
          <circle class="fk pt" cx="20" cy="12" r="1.9"/><circle class="fk pt" cx="26" cy="9" r="1.9"/>
          <path class="a fit" d="M3 27 L29 6"/>`,
    play: (el) => {
      pop(q(el, ".pt"), 50);
      animate(q(el, ".fit"), { rotate: [38, -6, 0], duration: 900, delay: 200, ease: "outElastic(1, .6)" });
    },
  },
  "Deep learning": {
    // a signal passing through the layers of a network
    svg: `<path class="k edge" d="M6 10 L16 6 M6 10 L16 16 M6 10 L16 26 M6 22 L16 6 M6 22 L16 16 M6 22 L16 26 M16 6 L26 16 M16 16 L26 16 M16 26 L26 16"/>
          <circle class="node l0" cx="6" cy="10" r="2.8"/><circle class="node l0" cx="6" cy="22" r="2.8"/>
          <circle class="node l1" cx="16" cy="6" r="2.8"/><circle class="node l1" cx="16" cy="16" r="2.8"/><circle class="node l1" cx="16" cy="26" r="2.8"/>
          <circle class="node l2" cx="26" cy="16" r="2.8"/>`,
    play: (el) => {
      ["l0", "l1", "l2"].forEach((l, i) =>
        animate(q(el, "." + l), { fill: [C().flag, C().panel], scale: [1.4, 1], duration: 600, delay: i * 180, ease: "outQuad" })
      );
    },
  },
  "Computer vision": {
    // a detection box locking on to an object
    svg: `<circle class="k obj" cx="16" cy="17" r="4.5"/><path class="k" d="M12 24 h8"/>
          <path class="a box" d="M6 11 V6 H11 M21 6 H26 V11 M26 21 V26 H21 M11 26 H6 V21"/>`,
    play: (el) => {
      animate(q(el, ".box"), { scale: [1.5, 1], opacity: [0, 1], rotate: [12, 0], duration: 600, ease: "outBack(1.8)" });
    },
  },
  NLP: {
    // a highlight moving across a line of text, token by token
    svg: `<path class="k" d="M4 9 H28 M4 16 H22 M4 23 H25"/><rect class="fa tok" x="4" y="13.5" width="7" height="5"/>`,
    play: (el) => {
      animate(q(el, ".tok"), { translateX: [0, 7.5, 15, 0], duration: 1100, ease: steps(1) });
    },
  },
  "Multimodal AI": {
    // sound, image and text meeting in one place
    svg: `<path class="k m1" d="M3 10 q2 -4 4 0 t4 0"/><rect class="k m2" x="21" y="6" width="7" height="7"/><path class="k m3" d="M12 26 h8 M13 23 h6"/>
          <circle class="a ring" cx="16" cy="16" r="3.5"/>`,
    play: (el) => {
      const tl = createTimeline({ defaults: { duration: 760, ease: "inOutQuad" } });
      tl.add(q(el, ".m1"), { translateX: [0, 7, 0], translateY: [0, 5, 0] }, 0)
        .add(q(el, ".m2"), { translateX: [0, -7, 0], translateY: [0, 5, 0] }, 0)
        .add(q(el, ".m3"), { translateY: [0, -7, 0] }, 0)
        .add(q(el, ".ring"), { scale: [0.4, 1.4, 1], opacity: [0, 1], duration: 600, ease: "outBack(2)" }, 250);
    },
  },
  "Embedded / TinyML": {
    // a microcontroller with a pulse running through its pins
    svg: `<rect class="k" x="9" y="9" width="14" height="14"/><rect class="fa core" x="13" y="13" width="6" height="6"/>
          <path class="k pin" d="M12 9 V4 M16 9 V4 M20 9 V4"/><path class="k pin" d="M23 12 H28 M23 16 H28 M23 20 H28"/>
          <path class="k pin" d="M20 23 V28 M16 23 V28 M12 23 V28"/><path class="k pin" d="M9 20 H4 M9 16 H4 M9 12 H4"/>`,
    play: (el) => {
      animate(q(el, ".pin"), { stroke: [C().flag, C().line], duration: 400, delay: stagger(110), ease: "outQuad" });
      animate(q(el, ".core"), { scale: [0.3, 1.2, 1], duration: 700, ease: "outBack(2)" });
    },
  },

  /* ---------- Tools ---------- */
  PyTorch: {
    // a training loss curve going down
    svg: `<path class="k" d="M5 4 V27 H29"/><path class="a loss" d="M7 7 C 11 18, 14 21, 18 22 S 25 24, 28 24"/><circle class="fa end" cx="28" cy="24" r="2.2"/>`,
    play: (el) => {
      animate(q(el, ".loss"), { strokeDashoffset: [40, 0], duration: 800, ease: "outQuad" });
      pop(q(el, ".end"));
    },
    dash: ".loss",
  },
  "TensorFlow Lite Micro": {
    // a big model shrinking to fit a small device
    svg: `<rect class="k big" x="5" y="5" width="22" height="22"/><path class="a" d="M5 5 L10 10 M27 5 L22 10 M5 27 L10 22 M27 27 L22 22"/>`,
    play: (el) => {
      animate(q(el, ".big"), { scale: [1, 0.45, 0.55], duration: 800, ease: "outBack(1.6)" }).then(() =>
        animate(q(el, ".big"), { scale: 1, duration: 500, delay: 500, ease: "outQuad" })
      );
    },
  },
  OpenCV: {
    // an edge being found in a grid of pixels
    svg: Array.from({ length: 16 }, (_, i) => {
      const x = 5 + (i % 4) * 6, y = 5 + Math.floor(i / 4) * 6;
      return `<rect class="px ${(i % 4) + Math.floor(i / 4) === 3 ? "edge" : ""}" x="${x}" y="${y}" width="4.6" height="4.6"/>`;
    }).join(""),
    play: (el) => {
      animate(q(el, ".px"), { opacity: [0.25, 1], duration: 300, delay: stagger(30, { grid: [4, 4], from: "first" }) });
      animate(q(el, ".edge"), { fill: [C().line, C().flag], duration: 400, delay: 550, ease: "outQuad" });
    },
  },
  Transformers: {
    // attention: one token looking at every other token
    svg: `<circle class="fk" cx="5" cy="25" r="2.4"/><circle class="fk" cx="12" cy="25" r="2.4"/><circle class="fk" cx="20" cy="25" r="2.4"/><circle class="fk" cx="27" cy="25" r="2.4"/>
          <path class="a att" d="M5 22 Q 8.5 14 12 22"/><path class="a att" d="M5 22 Q 12.5 8 20 22"/><path class="a att" d="M5 22 Q 16 2 27 22"/>`,
    play: (el) => {
      animate(q(el, ".att"), { strokeDashoffset: [30, 0], opacity: [0, 1], duration: 500, delay: stagger(150), ease: "outQuad" });
    },
    dash: ".att",
  },
  Flask: {
    // a request going out and a response coming back
    svg: `<path class="k req" d="M4 11 H24 M20 7 L24 11 L20 15"/><path class="a res" d="M28 21 H8 M12 17 L8 21 L12 25"/>`,
    play: (el) => {
      animate(q(el, ".req"), { translateX: [-8, 0], opacity: [0, 1], duration: 400, ease: "outExpo" });
      animate(q(el, ".res"), { translateX: [8, 0], opacity: [0, 1], duration: 400, delay: 300, ease: "outExpo" });
    },
  },
  React: {
    // a component tree growing its children
    svg: `<path class="k" d="M16 9 V14 M16 14 H8 V19 M16 14 H24 V19 M16 14 V19"/>
          <rect class="fa root" x="12" y="3" width="8" height="6"/>
          <rect class="k kid" x="4.5" y="19" width="7" height="6"/><rect class="k kid" x="12.5" y="19" width="7" height="6"/><rect class="k kid" x="20.5" y="19" width="7" height="6"/>`,
    play: (el) => {
      pop(q(el, ".root"));
      animate(q(el, ".kid"), { translateY: [-8, 0], opacity: [0, 1], duration: 450, delay: stagger(90, { start: 150 }), ease: "outBack(2)" });
    },
  },
  "Node.js": {
    // the event loop going round
    svg: `<g class="loop"><path class="k" d="M24.5 9.5 A 10 10 0 1 0 26 16"/><path class="a" d="M21 9 L25 9.5 L24.5 5.5"/></g><circle class="fa" cx="16" cy="16" r="2.4"/>`,
    play: (el) => {
      animate(q(el, ".loop"), { rotate: [0, 360], duration: 900, ease: "inOutQuad" });
    },
  },
  Docker: {
    // containers stacking up
    svg: `<path class="k" d="M3 28 H29"/><rect class="k ctr" x="5" y="20" width="10" height="7"/><rect class="k ctr" x="17" y="20" width="10" height="7"/><rect class="fa ctr" x="11" y="12" width="10" height="7"/>`,
    play: (el) => {
      animate(q(el, ".ctr"), { translateY: [-14, 0], opacity: [0, 1], duration: 500, delay: stagger(130), ease: "outBounce" });
    },
  },
  MongoDB: {
    // documents filing into a database
    svg: `<ellipse class="k" cx="16" cy="7" rx="10" ry="3.5"/><path class="k" d="M6 7 V25 Q16 31 26 25 V7"/>
          <path class="a rec" d="M10 13 H22"/><path class="a rec" d="M10 18 H22"/><path class="a rec" d="M10 23 H22"/>`,
    play: (el) => {
      animate(q(el, ".rec"), { translateY: [-8, 0], opacity: [0, 1], duration: 400, delay: stagger(120), ease: "outBack(2)" });
    },
  },
};

// Fallback for a skill without its own icon: a square that pops in.
export const FALLBACK = {
  svg: `<rect class="k fb" x="7" y="7" width="18" height="18"/><rect class="fa fb" x="13" y="13" width="6" height="6"/>`,
  play: (el) => pop(q(el, ".fb")),
};

export function glyphFor(name) {
  return GLYPHS[name] || FALLBACK;
}

// Prepare dashed paths (used by curves that "draw" via dash offset).
export function primeGlyph(el, glyph) {
  if (glyph.dash) q(el, glyph.dash).forEach((p) => { p.style.strokeDasharray = "40"; });
}
