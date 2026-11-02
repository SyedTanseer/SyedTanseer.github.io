// The waving figure next to the name: a line-drawn person with a pose-estimation
// skeleton (keypoints + bones) on top, like the output of a pose model.
import { animate, createTimeline, stagger, utils, spring } from "https://cdn.jsdelivr.net/npm/animejs@4.5.0/dist/bundles/anime.esm.min.js";

// Joint positions in the drawing (viewBox units).
const J = {
  head: [120, 70],
  neck: [120, 108],
  lSh: [88, 124], rSh: [152, 124],          // his right = viewer's left
  lEl: [72, 172], rEl: [184, 104],
  lWr: [80, 216], rWr: [198, 56],
  lHip: [104, 214], rHip: [136, 214],
  lKn: [100, 264], rKn: [140, 264],
  lAn: [97, 314], rAn: [143, 314],
};
const ELBOW = J.rEl; // pivot for the wave

const seg = (a, b) => `M ${J[a][0]} ${J[a][1]} L ${J[b][0]} ${J[b][1]}`;
// A limb drawn as an outlined capsule: a thick ink stroke with a slightly thinner fill stroke on top.
const limb = (a, b, w = 15) =>
  `<path class="p-out" d="${seg(a, b)}" stroke-width="${w}"/><path class="p-in" d="${seg(a, b)}" stroke-width="${w - 3.4}"/>`;
const bone = (a, b) => `<path class="p-bone" d="${seg(a, b)}"/>`;
const dot = (k) => `<circle class="p-kp" cx="${J[k][0]}" cy="${J[k][1]}" r="4.2"/>`;

export function buildPerson(svg) {
  svg.setAttribute("viewBox", "-12 -34 264 372");
  svg.innerHTML = `
    <g class="p-body">
      <g class="p-figure">
        ${limb("lHip", "lKn")}${limb("lKn", "lAn")}
        ${limb("rHip", "rKn")}${limb("rKn", "rAn")}
        <path class="p-out" d="M 86 316 L 102 316" stroke-width="9"/><path class="p-out" d="M 138 316 L 154 316" stroke-width="9"/>
        ${limb("lSh", "lEl")}${limb("lEl", "lWr")}
        <circle class="p-shape" cx="${J.lWr[0]}" cy="${J.lWr[1] + 4}" r="8"/>
        ${limb("rSh", "rEl")}
        <path class="p-shape" d="M 86 124 Q 120 112 154 124 L 147 218 Q 120 224 93 218 Z"/>
        <path class="p-line" d="M 120 118 L 120 160"/>
        ${limb("neck", "head", 14)}
        <circle class="p-shape" cx="${J.head[0]}" cy="${J.head[1]}" r="30"/>
        <!-- swept-up quiff with short sides -->
        <path class="p-hair" d="M 90.5 66 C 89 52 92 42 99 36 C 104 24 122 15 141 19 C 152 21 159 29 156 38 C 154 44 151 46 151.5 50 C 152 55 151 60 150 64 C 147 54 141 48 132 46 C 121 44 110 47 103 53 C 97 57 93 61 90.5 66 Z"/>
        <path class="p-strand" d="M 101 40 C 110 28 128 22 146 25 M 106 46 C 116 36 132 31 150 33 M 98 50 C 101 45 105 42 110 40"/>
        <g class="p-eyes">
          <ellipse class="p-eye" cx="109" cy="72" rx="2.8" ry="3.2"/>
          <ellipse class="p-eye" cx="131" cy="72" rx="2.8" ry="3.2"/>
        </g>
        <g class="p-glasses">
          <rect class="p-lens" x="99" y="63.5" width="19" height="16" rx="5"/>
          <rect class="p-lens" x="122" y="63.5" width="19" height="16" rx="5"/>
          <path class="p-line" d="M 118 69.5 Q 120 67 122 69.5 M 99 69 L 91.5 66.5 M 141 69 L 148.5 66.5"/>
        </g>
        <path class="p-line" d="M 110 87 Q 120 93 130 87"/>
      </g>

      <g class="p-skeleton">
        ${bone("head", "neck")}${bone("neck", "lSh")}${bone("neck", "rSh")}
        ${bone("lSh", "lEl")}${bone("lEl", "lWr")}${bone("rSh", "rEl")}
        ${bone("lSh", "lHip")}${bone("rSh", "rHip")}${bone("lHip", "rHip")}
        ${bone("lHip", "lKn")}${bone("lKn", "lAn")}${bone("rHip", "rKn")}${bone("rKn", "rAn")}
        ${["head", "neck", "lSh", "rSh", "lEl", "rEl", "lWr", "lHip", "rHip", "lKn", "rKn", "lAn", "rAn"].map(dot).join("")}
      </g>

      <!-- waving forearm: rotates around the elbow -->
      <g class="p-forearm" style="transform-box: view-box; transform-origin: ${ELBOW[0]}px ${ELBOW[1]}px">
        ${limb("rEl", "rWr")}
        <circle class="p-shape" cx="${J.rWr[0] + 1}" cy="${J.rWr[1] - 6}" r="9"/>
        <path class="p-line" d="M ${J.rWr[0] - 4} ${J.rWr[1] - 13} l -2 -7 M ${J.rWr[0] + 2} ${J.rWr[1] - 15} l 0 -7 M ${J.rWr[0] + 8} ${J.rWr[1] - 13} l 2 -7"/>
        ${bone("rEl", "rWr")}${dot("rWr")}
      </g>
      ${dot("rEl")}
    </g>

    <g class="p-box">
      <rect class="frame" x="44" y="10" width="172" height="318"/>
      <rect class="chip" x="42.5" y="-12" width="${"person 0.99".length * 7.6 + 14}" height="22"/>
      <text x="49.5" y="3.5">person 0.99</text>
    </g>`;
}

export function wave(svg, times = 2) {
  const arm = svg.querySelector(".p-forearm");
  const kf = [];
  for (let i = 0; i < times; i++) kf.push({ to: -24, duration: 220 }, { to: 16, duration: 260 });
  kf.push({ to: 0, duration: 360 });
  return animate(arm, { rotate: kf, ease: "inOutSine" });
}

// Keeps waving: the forearm swings back and forth around the elbow, forever.
export function waveForever(svg) {
  const arm = svg.querySelector(".p-forearm");
  animate(arm, { rotate: [{ to: -22, duration: 380 }], ease: "inOutSine" }).then(() =>
    animate(arm, { rotate: [-22, 16], duration: 460, ease: "inOutSine", loop: true, alternate: true })
  );
}

function blink(svg) {
  animate(svg.querySelectorAll(".p-eye"), { scaleY: [{ to: 0.1, duration: 70 }, { to: 1, duration: 110 }], ease: "linear" });
}

export function playPerson(svg, delay = 0) {
  const q = (s) => svg.querySelectorAll(s);
  utils.set(q(".p-body"), { opacity: 0, translateY: 40, scale: 0.55 });
  utils.set(q(".p-kp"), { opacity: 0, scale: 0 });
  utils.set(q(".p-bone"), { opacity: 0 });
  utils.set(q(".p-box"), { opacity: 0 });

  const tl = createTimeline({ delay })
    .add(q(".p-body"), { opacity: [0, 1], translateY: [40, 0], scale: [0.55, 1], ease: spring({ stiffness: 140, damping: 11 }) }, 0)
    .add(q(".p-kp"), { opacity: [0, 1], scale: [0, 1], duration: 300, ease: "outBack(2.5)", delay: stagger(45) }, 650)
    .add(q(".p-bone"), { opacity: [0, 0.95], duration: 400, ease: "outQuad" }, 900)
    .add(q(".p-box"), { opacity: [0, 1], scale: [1.15, 1], duration: 420, ease: "outBack(1.6)" }, 1300)
    .call(() => waveForever(svg), 1500);

  // Afterwards: blink every few seconds and let the eyes follow the pointer.
  tl.then(() => {
    const loop = () => { blink(svg); setTimeout(loop, 2800 + Math.random() * 3200); };
    setTimeout(loop, 1800);
  });

  const eyes = svg.querySelector(".p-eyes");
  window.addEventListener("pointermove", (e) => {
    const r = svg.getBoundingClientRect();
    const cx = r.left + r.width * 0.5, cy = r.top + r.height * 0.27;
    const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy) || 1;
    const m = Math.min(1, d / 300) * 2.6;
    eyes.style.transform = `translate(${(dx / d) * m}px, ${(dy / d) * m}px)`;
  }, { passive: true });
}
