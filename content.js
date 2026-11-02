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
    points: [
      "Developed a YOLO-based vision program that auto-detects aircraft engine parts needing maintenance.",
      "Worked with senior engineers and technicians to turn part-condition criteria into a detection pipeline.",
      "Documented model outputs and part conditions to support quality assurance and airworthiness reporting.",
    ],
  },
];

export const projects = [
  {
    title: "Multimodal AI Psychiatric Pre-Screening Assistant",
    when: "Oct 2025 – present",
    figure: "screening", // illustration from figures.js; remove this line to show none
    summary:
      "An observation-only assistant that analyses interview recordings across speech, voice and video to give clinicians a behavioural timeline.",
    points: [
      "Three modalities (NLP, acoustic, vision) across five modules: speech recognition, sentiment, vocal biomarkers, facial emotion and gaze tracking.",
      "Served through Flask APIs in Docker, with a React dashboard for clinicians.",
    ],
    stack: ["Python", "PyTorch", "Transformers", "OpenCV", "Librosa", "Flask", "React", "Docker"],
    links: [
      // { label: "Code", url: "https://github.com/SyedTanseer/your-repo" },
    ],
  },
  {
    title: "Edge AI Air Quality Prediction & Preventive Purification",
    when: "Dec 2025 – present",
    figure: "air",
    summary:
      "An IoT system that forecasts air quality on the device itself and switches on purification before the air gets bad.",
    points: [
      "Three sensors (MQ135, BME280, PMS5003) feed a TinyML AQI model running on an ESP32 — no cloud round-trip.",
      "React dashboard for live and historical trends, plus a relay that triggers the purifier automatically.",
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
  { group: "Programming", items: ["Python", "Java", "C"] },
  {
    group: "Areas",
    items: ["Machine learning", "Deep learning", "Computer vision", "NLP", "Multimodal AI", "Embedded / TinyML"],
  },
  {
    group: "Tools",
    items: ["PyTorch", "TensorFlow Lite Micro", "OpenCV", "Transformers", "Flask", "React", "Node.js", "Docker", "MongoDB"],
  },
  { group: "Spoken", items: ["Hindi", "English", "Japanese (elementary)"] },
];
