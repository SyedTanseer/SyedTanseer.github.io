// Everything written on the site lives here.
// To add, remove or reorder a project, edit the `projects` list below.
// Any field you leave out (links, status) is simply not shown.

export const profile = {
  name: "Syed Tanseer Shah",
  role: "M.Tech (Integrated) student in Cognitive Computing at SRM Institute of Science and Technology",
  intro:
    "I build computer vision and on-device AI that has to hold up outside the lab — from spotting worn aircraft engine parts at HAL to running air-quality forecasts on a microcontroller.",
  status: "", // optional line with a yellow dot above your name, e.g. "Open to internships"
  email: "tanseeracer@gmail.com",
  github: "https://github.com/SyedTanseer",
  resume: "resume.pdf",
};

export const experience = [
  {
    org: "Hindustan Aeronautics Limited (HAL)",
    title: "Intern, Overhaul Division",
    place: "Bangalore, Karnataka",
    when: "June 2026",
    figure: "engine", // the jet-engine inspection illustration from figures.js
    points: [
      "Developed a YOLO-based vision program that auto-detects aircraft engine parts needing maintenance, at 0.86 mAP@0.5.",
      "Turned part-condition criteria from senior engineers into a 6-class detector trained on 1,200 images.",
      "Ran inference at 32 ms per image, documenting outputs to support quality assurance and airworthiness reporting.",
    ],
  },
];

export const projects = [
  {
    title: "Connectome-Based Neural Navigation System",
    when: "Nov 2026 – present",
    figure: "connectome",
    summary:
      "A heading estimator wired from real fruit-fly neurons, tested against standard models to see what a biological circuit gets right.",
    points: [
      "Built a recurrent heading estimator from 155 neurons of the FlyWire fruit-fly connectome, trained on GPU.",
      "Benchmarked it against GRUs, degree-preserving rewired graphs and Kalman filters on accuracy, cost and fault tolerance.",
      "Found a ring attractor in the trained network whose stable states trade turn tracking for memory.",
      "Reproducible GPU experiment pipeline: pre-registered hypotheses, multi-seed runs, fault injection and dashboards.",
    ],
    stack: ["Python", "PyTorch", "CUDA", "JavaScript", "Three.js"],
    links: [],
  },
  {
    title: "ECOGENESIS: Multi-Agent RL Ecosystem for Invasion Ecology",
    when: "Nov 2026 – present",
    figure: "ecosystem",
    summary:
      "An ecosystem simulator where animals see each other only by their traits, used to study how invasive species and droughts play out.",
    points: [
      "Species-specific PPO agents trained on GPU, with attention over perceived traits, adapt to invasions and droughts.",
      "A temporal graph neural network forecasts extinctions caused by invaders unseen in training, compared against LSTM baselines.",
      "Live 2D/3D Three.js viewer with trait-generated animals, perception overlays and a disturbance lab.",
    ],
    stack: ["Python", "PyTorch", "CUDA", "NumPy", "SciPy", "JavaScript", "Three.js"],
    links: [],
  },
  {
    title: "Multimodal AI Psychiatric Pre-Screening Assistant",
    when: "Oct 2025 – Feb 2026",
    figure: "screening", // illustration from figures.js; remove this line to show none
    summary:
      "An observation-only assistant that analyses interview recordings across speech, voice and video to give clinicians a behavioural timeline.",
    points: [
      "Three modalities (NLP, acoustic, vision) across five modules: speech recognition (12.8% WER), facial emotion (68.4% on FER-2013), gaze, voice and sentiment.",
      "Served through Flask and Docker at 18 s of processing per interview minute, with a React dashboard for clinicians.",
    ],
    stack: ["Python", "PyTorch", "Transformers", "OpenCV", "Librosa", "Flask", "React", "Docker"],
    links: [
      // { label: "Code", url: "https://github.com/SyedTanseer/your-repo" },
    ],
  },
  {
    title: "Edge AI Air Quality Prediction & Preventive Purification",
    when: "Dec 2025 – Mar 2026",
    figure: "air",
    summary:
      "An IoT system that forecasts air quality on the device itself and switches on purification before the air gets bad.",
    points: [
      "Three sensors (MQ135, BME280, PMS5003) feed a 48 KB TinyML AQI model on an ESP32: 24 ms inference, 8.6 AQI MAE, no cloud round-trip.",
      "React dashboard for AQI trends, plus a relay that starts the purifier within 1.5 s of detecting a spike.",
    ],
    stack: ["ESP32", "TensorFlow Lite Micro", "Arduino", "React", "Node.js"],
    links: [],
  },
];

export const education = [
  {
    school: "S.R.M. Institute of Science and Technology",
    detail: "M.Tech (Integrated), CSE – Cognitive Computing",
    score: "CGPA 9.24 / 10",
    when: "2027",
  },
  {
    school: "St. Joseph's College, Allahabad",
    detail: "Class XII (ISC), PCM with Computer Science",
    score: "93.25%",
    when: "2021",
  },
];

export const skills = [
  { group: "Programming", items: ["Python", "Java", "C", "JavaScript"] },
  {
    group: "Areas",
    items: [
      "Machine learning", "Deep learning", "Reinforcement learning", "Graph neural networks",
      "Computer vision", "NLP", "Multimodal AI", "Embedded / TinyML", "State estimation",
    ],
  },
  {
    group: "Tools",
    items: [
      "PyTorch", "CUDA", "TensorFlow Lite Micro", "OpenCV", "Transformers", "Flask",
      "React", "Node.js", "Three.js", "Docker", "MongoDB",
    ],
  },
];

// Spoken languages. `level` is 0–1 and sets how far the bar fills.
export const languages = [
  { name: "Hindi", lang: "hi", greeting: "नमस्ते", note: "Native", level: 1 },
  { name: "English", lang: "en", greeting: "Hello", note: "Native", level: 1 },
  { name: "Japanese", lang: "ja", greeting: "こんにちは", note: "Elementary", level: 0.3 },
];
