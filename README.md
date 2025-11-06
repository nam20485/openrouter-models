# OpenRouter Models Explorer

A Vite + React + TypeScript dashboard for browsing OpenRouter-compatible language models. It fetches the live `/api/v1/models` endpoint (with a cached fallback dataset) and offers rich filtering, sorting, and dual presentation modes (card grid and detailed table view).

## Features

- 🔍 **Advanced filtering** by provider, maximum prompt price, context window bounds, and capability toggles (tools, JSON, vision, free tier).
- 📊 **Sorting** across derived rating, prompt/completion cost, context length, and alphabetical order with direction toggles.
- 🧭 **View toggle** between an informative card grid and a dense tabular list for quick comparisons.
- 🌐 **Live + fallback data**: automatically falls back to `public/models-sample.json` when the live API is unreachable.
- 📦 **Deterministic scoring** that normalizes cost, context, and capability coverage into a 1–5 rating.
- ✅ **Unit tests** (Vitest) covering filtering, sorting, and summary helpers.

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```pwsh
# from the repo root
npm install
```

### Running in development

```pwsh
npm run dev
```

Open the printed local URL (default http://localhost:5173) in your browser.

### Running tests (CI-friendly)

```pwsh
npm run test -- --run
```

### Production build

```pwsh
npm run build
```

Build outputs land in the `dist/` directory (`npm run preview` is also available via Vite if you want to serve the build locally).

## Configuration

Optional environment variables influence API access and headers. Create a `.env.local` (not committed) with any of the following:

```
VITE_OPENROUTER_API_KEY=<token>
VITE_APP_REFERER=<https://your-app.example>
VITE_APP_TITLE=<Your App Name>
```

When no API key is provided, only public models are returned (and the fallback dataset remains available).

## Project Structure

```
src/
  components/
    FilterPanel.tsx      # Filter + sort controls
    ModelCard.tsx        # Grid card presentation
    ModelTable.tsx       # Table view for dense comparison
  hooks/
    useModelDataset.ts   # Fetch + filter + sort orchestration
  lib/
    modelTransforms.ts   # Normalization & scoring helpers
    modelFilters.ts      # Filtering/sorting utilities (with tests)
  services/
    modelService.ts      # Live + fallback fetch logic
```

CSS modules drive component-level styling (`*.module.css`), and global resets live in `src/index.css`.

## Tasks & Automation

VS Code tasks are available under **Terminal → Run Task…**:

- `npm: dev`
- `npm: test (ci)`
- `npm: build`

## Data Notes

- Live calls go to `https://openrouter.ai/api/v1/models` with a 12s timeout.
- Responses are cached in-memory per session; use the **Refresh data** button to refetch.
- If the live call fails, the bundled `public/models-sample.json` seed dataset is loaded and a warning banner is shown.

## Accessibility & UX

- Filter controls include accessible labels/aria hints.
- The view toggle is keyboard operable and disabled while data is loading.
- Table captions are visually hidden but available to screen readers.

---

Happy exploring! Feel free to tailor the scoring heuristics or extend the filter set for your workflow.
