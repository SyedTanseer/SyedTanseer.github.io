// Project illustrations. Each figure has a `build(svg)` that draws it and a
// `play(svg)` that animates it (returns an Anime.js timeline).
// Figures are referenced from content.js by key:
// figure: "connectome" | "ecosystem" | "screening" | "air" | "engine".

import { animate, createTimeline, createDrawable, createMotionPath, stagger, utils } from "https://cdn.jsdelivr.net/npm/animejs@4.5.0/dist/bundles/anime.esm.min.js";

const CHAR_W = 7.6; // approx. width of one 13px mono character in SVG units

/** A detection frame with its label chip. align "end" puts the chip flush right; below puts it under the frame. */
export function detection({ label, x, y, w, h, align = "start", cls = "", below = false }) {
  const chipW = label.length * CHAR_W + 14;
  const chipX = align === "end" ? x + w + 1.5 - chipW : x - 1.5;
  const chipY = below ? y + h : y - 22;
  return `
    <g class="box ${cls}" aria-hidden="true">
      <rect class="frame" x="${x}" y="${y}" width="${w}" height="${h}"/>
      <rect class="chip" x="${chipX}" y="${chipY}" width="${chipW}" height="22"/>
      <text x="${chipX + 7}" y="${chipY + 15.5}">${label}</text>
    </g>`;
}

const fix = (n) => +n.toFixed(2);

/* ================================================================== */
/* 1. Multimodal psychiatric pre-screening                             */
/* ================================================================== */

const screening = {
  label:
    "Diagram: a face with landmark points and gaze lines next to a timeline of three tracks — speech, voice waveform and affect — with a long pause flagged.",
  caption: "Illustration: three signals from one interview, lined up on a single timeline.",

  build(svg) {
    svg.setAttribute("viewBox", "0 0 720 300");

    // --- Face panel ---
    const cx = 125, cy = 152, rx = 70, ry = 92;
    const jaw = Array.from({ length: 15 }, (_, i) => {
      const t = Math.PI * (0.08 + (0.84 * i) / 14);
      return [fix(cx + rx * Math.cos(t) * 0.98), fix(cy + ry * Math.sin(t) * 0.96)];
    });
    const brow = (x0) => Array.from({ length: 5 }, (_, i) => [x0 + i * 8, 120 - Math.sin((i / 4) * Math.PI) * 6]);
    const pts = [
      ...jaw,
      ...brow(84), ...brow(134),
      [125, 146], [125, 160], [119, 176], [125, 178], [131, 176],
      [104, 206], [114, 211], [125, 213], [136, 211], [146, 206],
      [88, 136], [108, 136], [142, 136], [162, 136],
    ];
    const dots = pts.map(([x, y]) => `<circle class="lm" cx="${x}" cy="${y}" r="2.6"/>`).join("");

    // --- Timeline panel ---
    const X0 = 352, X1 = 700;
    const pauseA = 540, pauseB = 594;

    // speech: word blocks (no blocks during the pause)
    const widths = [22, 14, 30, 18, 26, 12, 20, 34, 16, 24, 10, 28, 18, 22, 14];
    let x = X0, words = "";
    for (const w of widths) {
      if (x + w > X1) break;
      if (x + w > pauseA && x < pauseB) { x = pauseB + 4; continue; }
      words += `<rect class="word" x="${x}" y="66" width="${w}" height="14"/>`;
      x += w + 6;
    }

    // voice: waveform, flat during the pause
    let wave = `M ${X0} 150`;
    for (let px = X0; px <= X1; px += 3) {
      const quiet = px > pauseA && px < pauseB;
      const env = quiet ? 0.06 : 0.55 + 0.45 * Math.abs(Math.sin(px / 23));
      const a = 26 * env * Math.sin(px * 0.9) * Math.cos(px / 11);
      wave += ` L ${px} ${fix(150 + a)}`;
    }

    // affect: smooth line with a dip around the pause
    let affect = "";
    for (let px = X0; px <= X1; px += 4) {
      const dip = 22 * Math.exp(-(((px - 575) / 34) ** 2));
      const y = 222 - 9 * Math.sin(px / 41) + dip;
      affect += `${px === X0 ? "M" : " L"} ${px} ${fix(y)}`;
    }

    svg.innerHTML = `
      <g class="face">
        <ellipse class="draw" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>
        <path class="draw" d="M 84 122 Q 100 112 116 120"/>
        <path class="draw" d="M 134 120 Q 150 112 166 122"/>
        <ellipse class="draw" cx="98" cy="137" rx="13" ry="7"/>
        <ellipse class="draw" cx="152" cy="137" rx="13" ry="7"/>
        <circle class="draw pupil" cx="103" cy="135" r="3.5"/>
        <circle class="draw pupil" cx="157" cy="135" r="3.5"/>
        <path class="draw" d="M 125 146 L 118 177 Q 125 182 132 177"/>
        <path class="draw" d="M 104 206 Q 125 216 146 206"/>
        <path class="draw thin gaze" d="M 103 135 L 232 104"/>
        <path class="draw thin gaze" d="M 157 135 L 232 104"/>
        <circle class="draw thin gaze" cx="236" cy="103" r="5"/>
      </g>
      <g class="lms">${dots}</g>

      <g class="tracks">
        <text class="lbl" x="${X0 - 12}" y="78" text-anchor="end">speech</text>
        <text class="lbl" x="${X0 - 12}" y="155" text-anchor="end">voice</text>
        <text class="lbl" x="${X0 - 12}" y="228" text-anchor="end">affect</text>
        <line class="axis" x1="${X0}" y1="264" x2="${X1}" y2="264"/>
        <line class="axis faint" x1="${X0}" y1="222" x2="${X1}" y2="222"/>
        <g class="words">${words}</g>
        <path class="draw trace wave" d="${wave}"/>
        <path class="draw trace thick affect" d="${affect}"/>
      </g>

      <line class="playhead" x1="${X0}" y1="44" x2="${X0}" y2="270"/>

      <g class="flags">
        ${detection({ label: "face 0.98", x: 46, y: 48, w: 158, h: 212 })}
        ${detection({ label: "pause 2.4s", x: pauseA - 4, y: 58, w: pauseB - pauseA + 8, h: 196, align: "end" })}
        ${detection({ label: "gaze_away", x: 222, y: 92, w: 26, h: 24, align: "end" })}
      </g>`;
  },

  play(svg) {
    const q = (s) => svg.querySelectorAll(s);
    const faceLines = createDrawable(q(".face .draw"));
    const traces = createDrawable(q(".trace"));

    utils.set(q(".lm"), { opacity: 0 });
    utils.set(q(".word"), { opacity: 0 });
    utils.set(q(".box"), { opacity: 0 });
    utils.set(q(".playhead"), { opacity: 0 });
    utils.set(traces, { draw: "0 0" });

    return createTimeline({ defaults: { ease: "outExpo" } })
      .add(faceLines, { draw: ["0 0", "0 1"], duration: 900, ease: "inOutQuad", delay: stagger(40) }, 0)
      .add(q(".lm"), { opacity: [0, 1], scale: [2.2, 1], duration: 500, delay: stagger(12, { from: "center" }) }, 450)
      .add(q(".playhead"), { opacity: [0, 0.9], duration: 150 }, 700)
      .add(q(".playhead"), { x1: [352, 700], x2: [352, 700], duration: 2200, ease: "linear" }, 700)
      .add(traces, { draw: ["0 0", "0 1"], duration: 2200, ease: "linear" }, 700)
      .add(q(".word"), { opacity: [0, 1], duration: 200, delay: stagger(2200 / 15), ease: "linear" }, 700)
      .add(q(".playhead"), { opacity: 0, duration: 300 }, 2900)
      .add(q(".box"), { opacity: [0, 1], scale: [1.3, 1], duration: 420, ease: "outBack(1.6)", delay: stagger(160) }, 2700);
  },
};

/* ================================================================== */
/* 2. Edge AI air quality                                              */
/* ================================================================== */

const air = {
  label:
    "Diagram: three sensors wired to an ESP32, which drives a relay and a purifier fan, next to a chart where the AQI forecast crosses the 100 threshold.",
  caption: "Illustration: the board forecasts AQI and turns the purifier on before the air crosses 100.",

  build(svg) {
    svg.setAttribute("viewBox", "0 0 720 300");

    const sensors = [
      { name: "MQ135", what: "gas", y: 34 },
      { name: "BME280", what: "climate", y: 122 },
      { name: "PMS5003", what: "particles", y: 210 },
    ];
    const pinY = [108, 140, 172];
    const sensorG = sensors
      .map(
        (s, i) => `
        <rect class="draw part" x="20" y="${s.y}" width="122" height="52"/>
        <text class="name" x="32" y="${s.y + 23}">${s.name}</text>
        <text class="lbl" x="32" y="${s.y + 41}">${s.what}</text>
        <path class="draw wire" id="air-wire-${i}" d="M 142 ${s.y + 26} H ${182 - i * 0} V ${pinY[i]} H 222"/>`
      )
      .join("");

    // ESP32 board with pin teeth
    const teeth = Array.from({ length: 7 }, (_, i) => {
      const y = 92 + i * 16;
      return `<line class="draw thin" x1="222" y1="${y}" x2="230" y2="${y}"/><line class="draw thin" x1="330" y1="${y}" x2="338" y2="${y}"/>`;
    }).join("");

    // Chart: AQI 0 at y=200, 200 at y=40  → y = 200 - 0.8 * aqi
    const Y = (aqi) => fix(200 - 0.8 * aqi);
    const hist = [62, 58, 66, 71, 69, 75, 80, 78, 84];
    const fc = [90, 97, 104, 112, 118, 123, 126];
    const hx = (i) => 420 + i * 18; // history x: 420..564
    const nowX = hx(hist.length - 1);
    const fx = (i) => nowX + (i + 1) * 18; // forecast x: 582..690
    const histD = hist.map((v, i) => `${i ? "L" : "M"} ${hx(i)} ${Y(v)}`).join(" ");
    const fcDots = fc.map((v, i) => `<circle class="fc" cx="${fx(i)}" cy="${Y(v)}" r="3.4"/>`).join("");
    const crossX = fix(fx(1) + ((100 - 97) / (104 - 97)) * 18);

    // Purifier fan
    const blades = Array.from({ length: 4 }, (_, i) =>
      `<path class="draw thin bladefill" d="M 0 0 C 6 -6 14 -8 18 -2 C 12 2 6 4 0 0 Z" transform="rotate(${i * 90})"/>`
    ).join("");

    svg.innerHTML = `
      ${sensorG}
      <g class="board">
        <rect class="draw thick part" x="230" y="80" width="100" height="120"/>
        ${teeth}
        <rect class="draw" x="250" y="104" width="60" height="48"/>
        <text class="name" x="280" y="133" text-anchor="middle">ESP32</text>
        <text class="lbl" x="280" y="184" text-anchor="middle">TinyML</text>
      </g>
      <path class="draw wire" id="air-wire-3" d="M 280 200 V 236 H 300"/>
      <rect class="draw part relay" x="300" y="222" width="56" height="28"/>
      <text class="lbl" x="328" y="241" text-anchor="middle">relay</text>
      <path class="draw wire" d="M 356 236 H 380"/>
      <g class="purifier" style="transform-box: view-box; transform-origin: 404px 236px">
        <circle class="draw" cx="404" cy="236" r="24"/>
        <g transform="translate(404 236)">${blades}</g>
      </g>
      <text class="lbl" x="404" y="282" text-anchor="middle">purifier</text>

      <g class="chart">
        <line class="axis" x1="420" y1="200" x2="700" y2="200"/>
        <line class="axis faint" x1="420" y1="${Y(100)}" x2="700" y2="${Y(100)}"/>
        <text class="lbl" x="420" y="${Y(100) - 8}">AQI 100</text>
        <line class="axis dashed" x1="${nowX}" y1="40" x2="${nowX}" y2="200"/>
        <text class="lbl" x="${nowX - 6}" y="222" text-anchor="end">now</text>
        <text class="lbl" x="${nowX + 6}" y="222">forecast</text>
        <path class="draw trace thick hist" d="${histD}"/>
        <g class="fcs">${fcDots}</g>
      </g>

      <circle class="packet" r="4"/><circle class="packet" r="4"/><circle class="packet" r="4"/>

      <g class="flags">
        ${detection({ label: "forecast > 100", x: crossX - 13, y: Y(100) - 12, w: 26, h: 24, align: "end" })}
      </g>`;
  },

  play(svg) {
    const q = (s) => svg.querySelectorAll(s);
    const wires = [0, 1, 2].map((i) => svg.querySelector(`#air-wire-${i}`));
    const packets = q(".packet");

    utils.set(q(".fc"), { opacity: 0 });
    utils.set(q(".box"), { opacity: 0 });
    utils.set(packets, { opacity: 0 });
    svg.querySelector(".relay").classList.remove("on");

    const tl = createTimeline({ defaults: { ease: "outExpo" } })
      .add(createDrawable(q(".draw.part, .board .draw, .wire")), { draw: ["0 0", "0 1"], duration: 900, ease: "inOutQuad", delay: stagger(25) }, 0)
      .add(createDrawable(q(".hist")), { draw: ["0 0", "0 1"], duration: 1100, ease: "inOutSine" }, 500);

    // Sensor readings travel along each wire into the board, three rounds.
    packets.forEach((p, i) => {
      tl.add(p, { ...createMotionPath(wires[i]), opacity: [{ to: 1, duration: 80 }, { to: 1, duration: 520 }, { to: 0, duration: 80 }], duration: 680, ease: "inOutSine", loop: 2 }, 700 + i * 150);
    });

    return tl
      .add(q(".fc"), { opacity: [0, 1], scale: [0, 1], duration: 350, delay: stagger(110), ease: "outBack(2)" }, 2300)
      .add(q(".box"), { opacity: [0, 1], scale: [1.3, 1], duration: 420, ease: "outBack(1.6)" }, 3000)
      .call(() => svg.querySelector(".relay").classList.add("on"), 3300)
      .add(q(".purifier"), { rotate: [0, 1440], duration: 2600, ease: "outQuad" }, 3300);
  },

  rest(svg) {
    svg.querySelector(".relay").classList.add("on");
    utils.set(svg.querySelectorAll(".packet"), { opacity: 0 });
  },
};

/* ================================================================== */
/* 3. HAL engine inspection                                            */
/* ================================================================== */

const EC = 250;
const ept = (r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [fix(EC + r * Math.sin(a)), fix(EC - r * Math.cos(a))];
};
const EP = (r, deg) => ept(r, deg).join(" ");

const engine = {
  label: "Line drawing of a jet engine fan seen from the front, with inspection boxes marking parts to check.",
  caption: "Illustration of the kind of inspection I built at HAL.",
  replayLabel: "Run scan again",

  build(svg) {
    svg.setAttribute("viewBox", "0 0 500 500");
    const BLADES = 20, STEP = 360 / BLADES;
    // A swept fan blade: narrow at the root, wide and twisted at the tip.
    const bladePath = (a) =>
      [
        `M ${EP(48, a)}`,
        `Q ${EP(125, a - 3)} ${EP(198, a + 6)}`,
        `A 198 198 0 0 1 ${EP(198, a + 19)}`,
        `Q ${EP(125, a + 13)} ${EP(48, a + 11)}`,
        `A 48 48 0 0 0 ${EP(48, a)} Z`,
      ].join(" ");
    const blades = Array.from({ length: BLADES }, (_, i) => `<path class="draw blade" d="${bladePath(i * STEP)}"/>`).join("");
    const ticks = Array.from({ length: 72 }, (_, i) => {
      const a = i * 5, len = i % 6 === 0 ? 9 : 4;
      const [x1, y1] = ept(214, a), [x2, y2] = ept(214 + len, a);
      return `<line class="draw faint" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    }).join("");

    // Inspection boxes (positions assume the fan stops at 0°).
    const boxes = [
      { label: "tip_erosion 0.91", x: 350, y: 66, w: 78, h: 82 },
      { label: "edge_nick 0.84", x: 86, y: 330, w: 66, h: 60 },
      { label: "spinner_ok 0.97", x: 198, y: 198, w: 104, h: 104 },
      { label: "liner_dent 0.78", x: 26, y: 112, w: 60, h: 66 },
    ].map(detection).join("");

    svg.innerHTML = `
      <g class="casing">
        <circle class="draw thick" cx="${EC}" cy="${EC}" r="236"/>
        <circle class="draw" cx="${EC}" cy="${EC}" r="226"/>
        <circle class="draw faint" cx="${EC}" cy="${EC}" r="204"/>
      </g>
      <g class="ticks">${ticks}</g>
      <g class="fan" style="transform-box: view-box; transform-origin: ${EC}px ${EC}px">
        ${blades}
        <circle class="draw thick hubfill" cx="${EC}" cy="${EC}" r="48"/>
        <circle class="draw" cx="${EC}" cy="${EC}" r="24"/>
        <path class="draw" d="M ${EC} ${EC - 24} Q ${EC + 30} ${EC - 6} ${EC + 16} ${EC + 20}"/>
      </g>
      <line class="sweep" x1="0" y1="0" x2="500" y2="0"/>
      <g class="flags">${boxes}</g>`;
  },

  play(svg) {
    const q = (s) => svg.querySelectorAll(s);
    utils.set(q(".box"), { opacity: 0 });
    utils.set(q(".blade"), { opacity: 0 });

    return createTimeline({ defaults: { ease: "outExpo" } })
      .add(createDrawable(q(".casing .draw, .fan .draw:not(.blade), .ticks .draw")), { draw: ["0 0", "0 1"], duration: 1300, ease: "inOutQuad", delay: stagger(6) }, 0)
      .add(q(".blade"), { opacity: [0, 1], duration: 500, delay: stagger(25) }, 500)
      .add(q(".fan"), { rotate: [0, 1080], duration: 3000, ease: "outQuart" }, 750)
      .add(q(".sweep"), { y1: [10, 490], y2: [10, 490], opacity: [{ to: 0.9, duration: 120 }, { to: 0, delay: 620, duration: 160 }], duration: 900, ease: "inOutSine" }, 3250)
      .add(q(".box"), { opacity: [0, 1], scale: [1.35, 1], duration: 420, ease: "outBack(1.6)", delay: stagger(140) }, 3900);
  },
};

/* ================================================================== */
/* 4. Connectome heading estimator (ring attractor)                    */
/* ================================================================== */

const CN = { cx: 150, cy: 150, r: 96, n: 16, inner: 40 };
const FAULT_T = 0.5;          // fraction of the run when neurons are switched off
const FAULTY = [9, 10];       // outer-ring neurons that get switched off
const cnPt = (r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [fix(CN.cx + r * Math.sin(a)), fix(CN.cy - r * Math.cos(a))];
};
// The fly's true heading over the run (degrees), and the network's slightly lagged estimate.
const trueHeading = (t) => 180 + 110 * Math.sin(2 * Math.PI * 0.9 * t) + 40 * Math.sin(2 * Math.PI * 2.3 * t + 1);
const estHeading = (t) => trueHeading(Math.max(0, t - 0.015)) + 5 * Math.sin(37 * t);
const CX0 = 390, CX1 = 700;
const chX = (t) => fix(CX0 + t * (CX1 - CX0));
const chY = (deg) => fix(260 - (deg / 360) * 200);

/** Draws the ring state at progress p (0..1): activity bump, heading arrow, playhead, faults. */
function renderRing(svg, p) {
  const th = estHeading(p);
  const faulted = p >= FAULT_T;
  svg.querySelectorAll(".act").forEach((c, i) => {
    let d = Math.abs(((i * 360) / CN.n - th) % 360);
    if (d > 180) d = 360 - d;
    const off = faulted && FAULTY.includes(i);
    c.style.opacity = off ? 0 : fix(Math.exp(-((d / 26) ** 2)));
  });
  svg.querySelector(".heading").setAttribute("transform", `rotate(${fix(th)} ${CN.cx} ${CN.cy})`);
  const ph = svg.querySelector(".playhead");
  ph.setAttribute("x1", chX(p));
  ph.setAttribute("x2", chX(p));
  svg.querySelectorAll(".xmark, .fault-on").forEach((el) => (el.style.opacity = faulted ? 1 : 0));
}

const connectome = {
  label:
    "Diagram: a ring of neurons with a bump of activity that follows the fly's heading, two neurons marked as switched off, next to a chart where the network's heading estimate tracks the true heading.",
  caption: "Illustration: activity circles the ring as the fly turns, and the estimate holds even with neurons switched off.",

  build(svg) {
    svg.setAttribute("viewBox", "0 0 720 300");
    const outer = Array.from({ length: CN.n }, (_, i) => cnPt(CN.r, (i * 360) / CN.n));
    const inner = Array.from({ length: 8 }, (_, j) => cnPt(CN.inner, 22.5 + j * 45));

    const chords = outer
      .map(([x1, y1], i) => {
        const [x2, y2] = outer[(i + 3) % CN.n];
        return `<line class="draw thin faint" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
      })
      .join("");
    const spokes = inner
      .map(([x1, y1], j) =>
        [0, 1, 2]
          .map((k) => {
            const [x2, y2] = outer[(2 * j + k) % CN.n];
            return `<line class="draw thin faint" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
          })
          .join("")
      )
      .join("");
    const outerNodes = outer
      .map(([x, y]) => `<circle class="draw nrn" cx="${x}" cy="${y}" r="7"/><circle class="act" cx="${x}" cy="${y}" r="4.6"/>`)
      .join("");
    const innerNodes = inner.map(([x, y]) => `<circle class="draw nrn" cx="${x}" cy="${y}" r="4"/>`).join("");
    const xmarks = FAULTY.map((i) => {
      const [x, y] = outer[i];
      return `<path class="xmark" d="M ${x - 6} ${y - 6} L ${x + 6} ${y + 6} M ${x + 6} ${y - 6} L ${x - 6} ${y + 6}"/>`;
    }).join("");

    const curve = (fn) =>
      Array.from({ length: 101 }, (_, k) => `${k ? "L" : "M"} ${chX(k / 100)} ${chY(fn(k / 100))}`).join(" ");
    const [fa, fb] = FAULTY.map((i) => outer[i]);
    const fx0 = Math.min(fa[0], fb[0]) - 12, fy0 = Math.min(fa[1], fb[1]) - 12;

    svg.innerHTML = `
      <g class="net">
        <circle class="draw thick" cx="${CN.cx}" cy="${CN.cy}" r="${CN.r}"/>
        ${chords}${spokes}
      </g>
      <g class="nodes">${outerNodes}${innerNodes}</g>
      <path class="draw thick heading" d="M ${CN.cx} ${CN.cy} V 86 M ${CN.cx - 7} 96 L ${CN.cx} 86 L ${CN.cx + 7} 96"/>
      ${xmarks}

      <g class="chart">
        <line class="axis" x1="${CX0}" y1="260" x2="${CX1}" y2="260"/>
        <line class="axis faint" x1="${CX0}" y1="60" x2="${CX1}" y2="60"/>
        <text class="lbl" x="${CX0 - 8}" y="264" text-anchor="end">0°</text>
        <text class="lbl" x="${CX0 - 8}" y="64" text-anchor="end">360°</text>
        <line class="draw thin legend-true" x1="540" y1="32" x2="564" y2="32"/>
        <text class="lbl" x="570" y="36">true</text>
        <line class="draw thick" x1="612" y1="32" x2="636" y2="32"/>
        <text class="lbl" x="642" y="36">estimate</text>
        <line class="axis dashed fault-on" x1="${chX(FAULT_T)}" y1="60" x2="${chX(FAULT_T)}" y2="260"/>
        <text class="lbl fault-on" x="${chX(FAULT_T) + 6}" y="280">faults on</text>
        <path class="draw trace true-trace" d="${curve(trueHeading)}"/>
        <path class="draw trace thick est-trace" d="${curve(estHeading)}"/>
      </g>

      <line class="playhead" x1="${CX0}" y1="52" x2="${CX0}" y2="266"/>

      <g class="flags">
        ${detection({ label: "ring attractor", x: CN.cx - CN.r - 8, y: CN.cy - CN.r - 8, w: 2 * CN.r + 16, h: 2 * CN.r + 16 })}
        ${detection({ label: "faults", x: fix(fx0), y: fix(fy0), w: fix(Math.abs(fa[0] - fb[0]) + 24), h: fix(Math.abs(fa[1] - fb[1]) + 24) })}
      </g>`;
    renderRing(svg, 1);
  },

  play(svg) {
    const q = (s) => svg.querySelectorAll(s);
    const traces = createDrawable(q(".trace"));
    const state = { p: 0 };

    utils.set(q(".box"), { opacity: 0 });
    utils.set(q(".playhead"), { opacity: 0 });
    utils.set(traces, { draw: "0 0" });
    renderRing(svg, 0);
    utils.set(q(".nodes circle"), { opacity: 0 }); // the bump appears once the run starts

    return createTimeline({ defaults: { ease: "outExpo" } })
      .add(createDrawable(q(".net .draw")), { draw: ["0 0", "0 1"], duration: 1000, ease: "inOutQuad", delay: stagger(12) }, 0)
      .add(q(".nodes circle.nrn"), { opacity: [0, 1], scale: [2, 1], duration: 450, delay: stagger(20) }, 300)
      .add(q(".playhead"), { opacity: [0, 0.9], duration: 150 }, 900)
      .add(traces, { draw: ["0 0", "0 1"], duration: 3000, ease: "linear" }, 900)
      .add(state, { p: [0, 1], duration: 3000, ease: "linear", onUpdate: () => renderRing(svg, state.p) }, 900)
      .add(q(".playhead"), { opacity: 0, duration: 300 }, 3900)
      .add(q(".box"), { opacity: [0, 1], scale: [1.3, 1], duration: 420, ease: "outBack(1.6)", delay: stagger(200) }, 3900);
  },

  rest(svg) {
    renderRing(svg, 1);
  },
};

/* ================================================================== */
/* 5. ECOGENESIS: trait-based perception and invasion forecasting      */
/* ================================================================== */

const ecosystem = {
  label:
    "Diagram: animals of different sizes in a habitat while an invader enters; a predator's perception cone labels the invader by its traits, not its species. Beside it, a population chart shows the native species declining after the invasion, with a forecast reaching extinction.",
  caption: "Illustration: a predator reads an invader by its traits alone, and the model forecasts a native species dying out.",

  build(svg) {
    svg.setAttribute("viewBox", "0 0 720 300");

    // Habitat
    const plants = [[48, 60], [130, 64], [300, 48], [40, 170], [176, 232], [312, 262], [230, 132], [96, 120], [270, 254]]
      .map(([x, y]) => `<path class="draw thin faint plant" d="M ${x} ${y} l -4 -8 M ${x} ${y} l 0 -10 M ${x} ${y} l 4 -8"/>`)
      .join("");
    const herb = ([x, y, r]) => `
      <g class="crit herb" transform="translate(${x} ${y})"><g class="pop">
        <circle class="draw critfill" r="${r}"/><circle class="eye" cx="${fix(r * 0.4)}" cy="${fix(-r * 0.3)}" r="1.6"/>
      </g></g>`;
    const pred = ([x, y, deg, s]) => `
      <g class="crit pred" transform="translate(${x} ${y}) rotate(${deg})"><g class="pop">
        <path class="draw thick critfill" d="M ${12 * s} 0 L ${-8 * s} ${-8 * s} L ${-4 * s} 0 L ${-8 * s} ${8 * s} Z"/>
      </g></g>`;
    const herbs = [[70, 92, 8], [115, 212, 7], [150, 116, 9], [262, 226, 6], [72, 250, 7], [298, 192, 8]].map(herb).join("");
    const P = [200, 175];
    const INV = [285, 95];
    const aim = (Math.atan2(INV[1] - P[1], INV[0] - P[0]) * 180) / Math.PI;
    const preds = [[...P, fix(aim), 1.1], [96, 160, 160, 0.9]].map(pred).join("");

    // A spiky invader whose shape is generated from its traits.
    const spikes = Array.from({ length: 14 }, (_, i) => {
      const a = (i * Math.PI) / 7, rr = i % 2 ? 8 : 15;
      return `${i ? "L" : "M"} ${fix(rr * Math.cos(a))} ${fix(rr * Math.sin(a))}`;
    }).join(" ") + " Z";

    // Perception cone from the predator toward the invader.
    const cone = (r, half) => {
      const p = (d) => {
        const a = ((aim + d) * Math.PI) / 180;
        return `${fix(P[0] + r * Math.cos(a))} ${fix(P[1] + r * Math.sin(a))}`;
      };
      return `M ${P.join(" ")} L ${p(-half)} A ${r} ${r} 0 0 1 ${p(half)} Z`;
    };

    // Population chart: y = 250 is zero.
    const X_INV = 480, X_NOW = 600;
    const native = [], invader = [];
    for (let x = 390; x <= X_NOW; x += 6) {
      const wob = 4 * Math.sin(x / 9);
      native.push(`${native.length ? "L" : "M"} ${x} ${fix(x < X_INV ? 110 + wob : 110 + ((x - X_INV) / 120) * 80 + wob)}`);
      if (x >= X_INV) invader.push(`${invader.length ? "L" : "M"} ${x} ${fix(248 - ((x - X_INV) / 120) * 88 + (x > X_INV ? wob * 0.6 : 0))}`);
    }
    const fcDots = [200, 210, 220, 230, 240, 250]
      .map((y, i) => `<circle class="fc" cx="${615 + i * 15}" cy="${y}" r="3.4"/>`)
      .join("");

    svg.innerHTML = `
      <g class="field">
        <rect class="draw" x="20" y="28" width="310" height="244"/>
        ${plants}
      </g>
      <path class="cone" d="${cone(128, 20)}"/>
      <line class="percept" x1="${P[0]}" y1="${P[1]}" x2="${INV[0]}" y2="${INV[1]}"/>
      ${herbs}${preds}
      <g class="inv" transform="translate(${INV.join(" ")})"><g class="pop">
        <path class="draw thick critfill" d="${spikes}"/><circle class="eye" cx="4" cy="-3" r="1.8"/>
      </g></g>

      <g class="chart">
        <line class="axis" x1="390" y1="250" x2="700" y2="250"/>
        <line class="axis dashed" x1="${X_INV}" y1="50" x2="${X_INV}" y2="250"/>
        <text class="lbl" x="${X_INV + 6}" y="46">invader arrives</text>
        <line class="axis dashed" x1="${X_NOW}" y1="50" x2="${X_NOW}" y2="250"/>
        <text class="lbl" x="${X_NOW + 6}" y="66">now</text>
        <text class="lbl" x="392" y="96">native</text>
        <text class="lbl" x="${X_NOW + 6}" y="164">invader</text>
        <path class="draw trace thick native" d="${native.join(" ")}"/>
        <path class="draw trace invader-trace" d="${invader.join(" ")}"/>
        <g class="fcs">${fcDots}</g>
      </g>

      <line class="playhead" x1="390" y1="44" x2="390" y2="256"/>

      <g class="flags">
        ${detection({ label: "traits: large, fast", x: INV[0] - 17, y: INV[1] - 17, w: 34, h: 34, align: "end" })}
        ${detection({ label: "extinction", x: 678, y: 238, w: 24, h: 24, align: "end", below: true })}
      </g>`;
  },

  play(svg) {
    const q = (s) => svg.querySelectorAll(s);
    const nativeLine = createDrawable(q(".native"));
    const invLine = createDrawable(q(".invader-trace"));
    const SWEEP = 2500, T0 = 900;
    const tInv = T0 + ((480 - 390) / (600 - 390)) * SWEEP;

    utils.set(q(".box, .fc, .playhead, .cone, .percept"), { opacity: 0 });
    utils.set(q(".crit .pop, .inv .pop"), { opacity: 0 });
    utils.set([nativeLine, invLine].flat(), { draw: "0 0" });

    return createTimeline({ defaults: { ease: "outExpo" } })
      .add(createDrawable(q(".field .draw")), { draw: ["0 0", "0 1"], duration: 900, ease: "inOutQuad", delay: stagger(40) }, 0)
      .add(q(".crit .pop"), { opacity: [0, 1], scale: [0, 1], duration: 450, ease: "outBack(2)", delay: stagger(70) }, 300)
      .add(q(".herb .pop"), {
        translateX: [{ to: 9 }, { to: -7 }, { to: 0 }],
        translateY: [{ to: -6 }, { to: 7 }, { to: 0 }],
        duration: 2800, ease: "inOutSine", delay: stagger(110),
      }, T0)
      .add(q(".playhead"), { opacity: [0, 0.9], duration: 150 }, T0)
      .add(q(".playhead"), { x1: [390, 600], x2: [390, 600], duration: SWEEP, ease: "linear" }, T0)
      .add(nativeLine, { draw: ["0 0", "0 1"], duration: SWEEP, ease: "linear" }, T0)
      .add(invLine, { draw: ["0 0", "0 1"], duration: T0 + SWEEP - tInv, ease: "linear" }, tInv)
      .add(q(".inv .pop"), { opacity: [0, 1], translateX: [70, 0], translateY: [-16, 0], duration: 1100, ease: "outQuad" }, tInv)
      .add(q(".cone, .percept"), { opacity: [0, 1], duration: 500, ease: "outQuad" }, tInv + 1000)
      .add(q(".playhead"), { opacity: 0, duration: 300 }, T0 + SWEEP)
      .add(q(".fc"), { opacity: [0, 1], scale: [0, 1], duration: 350, delay: stagger(110), ease: "outBack(2)" }, T0 + SWEEP)
      .add(q(".box"), { opacity: [0, 1], scale: [1.3, 1], duration: 420, ease: "outBack(1.6)", delay: stagger(500) }, tInv + 1300);
  },
};

export const figures = { screening, air, engine, connectome, ecosystem };
