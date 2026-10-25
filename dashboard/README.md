# Project dashboard

A single-page React site that presents the whole project: the problem, the shared
pipeline, all five sub-studies, the Phase 2 Restormer results for Levels 5–10, a
side-by-side comparison of every model on the same samples, findings, progress and
the team.

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
folder can be served from any host or sub-path. The workflow in
`.github/workflows/deploy-dashboard.yml` publishes it to GitHub Pages on every push to
`main` once Pages is set to "GitHub Actions" in the repository settings.

## Layout

```
src/
├── App.jsx                 Page order
├── data/project.js         All measured results, team and paper list
├── components/
│   ├── Hero.jsx            Interactive defocus specimen and headline numbers
│   ├── Problem.jsx         Why OCR fails, dataset and pairing protocol
│   ├── Pipeline.jsx        Shared pipeline, degradation model, RABD loss
│   ├── Studies.jsx         Tabbed view of the five sub-studies
│   ├── Phase2.jsx          Restormer Levels 5–10, Level 5 OCR results
│   ├── Compare.jsx         Same-sample grid across every model
│   ├── Findings.jsx        Findings, module status, roadmap, limitations
│   ├── Team.jsx            Team, papers, footer
│   ├── charts.jsx          Recharts wrappers that follow the theme
│   └── ui.jsx              Theme, lightbox and shared building blocks
└── styles.css              Design tokens (light and dark) and layout
```
