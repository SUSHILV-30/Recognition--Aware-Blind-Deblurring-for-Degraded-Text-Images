# Project dashboard

A single-page React site that presents the whole project: the problem, the system
architecture, the method, the five restoration models, a side-by-side comparison of every
model on the same samples, OCR results, findings, progress and the team. Each model opens
its own page (`#/models/<id>`) with its architecture, training recipe, every measured
result and sample outputs; the Restormer page also carries the Phase 2 results for HDC
Levels 5–10.

Built with Vite, React 18 and Recharts. Every number on the page comes from the team's
papers, slides or notebook outputs and lives in `src/data/project.js`; figures are in
`public/img/`.

## Run locally

```bash
cd dashboard
npm install
npm run dev
```

Then open http://localhost:5173.

## Build

```bash
npm run build
```

The static site is written to `dashboard/dist/`. It uses relative asset paths, so the
folder can be served from any host or sub-path. `npm run check:assets` fails if the source names an image that is not in `public/img/`.

## CI/CD

`.github/workflows/deploy-dashboard.yml` runs on every push to any branch and on every
pull request that touches `dashboard/`: it installs with `npm ci`, checks image
references, builds, and uploads the built site as a run artifact. On `main` it then
deploys that build to GitHub Pages. Set Pages to "GitHub Actions" in the repository
settings once.

## Layout

```
src/
├── App.jsx                 Home page order and hash routing to model pages
├── route.js                Hash router: #/models/<id> or a home section
├── data/
│   ├── project.js          All measured results, team and paper list
│   └── models.js           The five models: card text, headline numbers, sparklines
├── components/
│   ├── Hero.jsx            Interactive defocus specimen and headline numbers
│   ├── Problem.jsx         Why OCR fails, dataset and pairing protocol
│   ├── Architecture.jsx    System diagram and per-model architecture tabs
│   ├── diagrams.jsx        HTML/CSS architecture diagrams for each model
│   ├── Pipeline.jsx        Method: degradation model, RABD loss, input anchoring
│   ├── Models.jsx          Five model cards linking to their pages
│   ├── ModelPage.jsx       Model page layout: hero, section nav, pager
│   ├── modelkit.jsx        Shared blocks for model pages
│   ├── models/             Content for each model page (Restormer includes Phase 2)
│   ├── Compare.jsx         Same-sample grid across every model
│   ├── Ocr.jsx             OCR accuracy by level and method
│   ├── Findings.jsx        Findings, module status, roadmap, limitations
│   ├── Team.jsx            Team, papers, footer
│   ├── charts.jsx          Recharts wrappers that follow the theme
│   └── ui.jsx              Theme, lightbox and shared building blocks
└── styles.css              Design tokens (light and dark) and layout
```
