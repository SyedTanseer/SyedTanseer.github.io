// Project illustrations. Each figure has a `build(svg)` that draws it and a
// `play(svg)` that animates it (returns an Anime.js timeline).
// Figures are referenced from content.js by key: figure: "screening" | "air".

import { animate, createTimeline, createDrawable, createMotionPath, stagger, utils } from "https://cdn.jsdelivr.net/npm/animejs@4.5.0/dist/bundles/anime.esm.min.js";

const CHAR_W = 7.6; // approx. width of one 13px mono character in SVG units

/** A yellow detection frame with its label chip. align "end" puts the chip flush right. */
export function detection({ label, x, y, w, h, align = "start", cls = "" }) {
  const chipW = label.length * CHAR_W + 14;
  const chipX = align === "end" ? x + w + 1.5 - chipW : x - 1.5;
  const chipY = y - 22;
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

export const figures = { screening, air };
