# Portfolio — Syed Tanseer Shah

A static portfolio site. Plain HTML/CSS/JS, animated with [Anime.js](https://animejs.com) v4.5, loaded from the jsDelivr CDN (no build step, nothing to install).

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page structure |
| `content.js` | **All the text** — name, intro, experience, projects, education, skills. Edit this to change what the site says. |
| `styles.css` | Colours, type and layout. Colours are variables at the top. |
| `main.js` | Renders `content.js` into the page and runs the name animation. |
| `figures.js` | The illustrations (HAL engine scan, screening timeline, air-quality board) and their animations. |
| `resume.pdf` | Linked from the "Résumé (PDF)" button — replace it with your latest version (same filename). |
| `.nojekyll` | Tells GitHub Pages to serve files as-is. |

## Adding or swapping a project

Open `content.js` and add an object to the `projects` list:

```js
{
  title: "Project name",
  when: "2026",
  summary: "One sentence on what it is and who it's for.",
  points: ["What you did, with a number if you have one."],
  stack: ["Python", "PyTorch"],
  links: [{ label: "Code", url: "https://github.com/SyedTanseer/repo" }],
},
```

Projects appear in the order they're listed.

## Previewing locally

Because the site uses JavaScript modules, opening `index.html` by double-clicking won't work. From this folder run:

```
python -m http.server 8000
```

then open http://localhost:8000. (Or use the "Live Server" extension in VS Code.)

## Publishing on GitHub Pages

1. Create a repo named **`SyedTanseer.github.io`** (your username + `.github.io`) — that gives you the address `https://SyedTanseer.github.io`. Any other repo name also works, at `https://SyedTanseer.github.io/<repo-name>/`.
2. Push these files to the root of the `main` branch:
   ```
   git init
   git add .
   git commit -m "Portfolio site"
   git branch -M main
   git remote add origin https://github.com/SyedTanseer/SyedTanseer.github.io.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
4. After a minute or two the site is live.

## The illustrations

Each drawing lives in `figures.js` (`engine`, `screening`, `air`) and is attached to an entry in `content.js` with `figure: "<name>"`. Remove that line to hide a drawing. Each one animates the first time it scrolls into view and has a replay button. Visitors who have "reduce motion" turned on see the finished drawing with no animation.
