# IFLOW.md - OpenRouter Models Explorer

## Project Overview

This is a Vite + React + TypeScript dashboard application for browsing OpenRouter-compatible language models. It fetches live data from the OpenRouter `/api/v1/models` endpoint with a cached fallback dataset (`public/models-sample.json`) when the API is unreachable. The application provides rich filtering, sorting capabilities, and supports dual presentation modes (card grid and detailed table view).

Key technologies:
- **Frontend Framework**: React 18 (TypeScript)
- **Build Tool**: Vite
- **Package Manager**: npm
- **Testing Framework**: Vitest
- **Styling**: CSS Modules and global CSS

## Building and Running

### Prerequisites
- Node.js 20+
- npm 10+

### Installation
```bash
npm install
```

### Development Mode
```bash
npm run dev
```
This starts the development server at http://localhost:5173 by default.

### Running Tests
```bash
npm run test -- --run
```

### Production Build
```bash
npm run build
```
Build outputs go to the `dist/` directory. You can use `npm run preview` to serve the build locally via Vite.

## Project Structure

```
src/
  components/
    FilterPanel.tsx      # Filter and sort controls
    ModelCard.tsx        # Grid card presentation
    ModelTable.tsx       # Table view for detailed comparison
  hooks/
    useModelDataset.ts   # Fetch + filter + sort orchestration
  lib/
    modelTransforms.ts   # Normalization & scoring helpers
    modelFilters.ts      # Filtering/sorting utilities (with tests)
  services/
    modelService.ts      # Live + fallback fetch logic
```

- **Styling**: CSS modules for component-level styling (`*.module.css`), with global resets in `src/index.css`.
- **Type Definitions**: Project type definitions are in `src/types.ts`.

## Development Conventions

- **Component-Driven Development**: UI is built with independent React components, each with its own CSS module file.
- **Data Flow**: Data fetching (`modelService`) -> Data processing and state management (`useModelDataset` hook) -> Filtering/sorting (`modelFilters`) -> UI rendering (`App`, `components`).
- **State Management**: Uses React's built-in `useState` and `useMemo` hooks for local state management.
- **Testing**: Uses Vitest for unit tests, primarily covering filtering, sorting, and data transformation logic in the `lib/` directory.
- **Styling**: Uses CSS Modules to avoid style conflicts, following BEM class naming conventions.

## Configuration

API access can be configured with environment variables:

Create a `.env.local` file in the project root (not committed to version control):

```
VITE_OPENROUTER_API_KEY=<your-openrouter-api-key>
VITE_APP_REFERER=<https://your-app.example>
VITE_APP_TITLE=<Your App Name>
```

Without an API key, only public models are returned, and the fallback dataset remains available.

## Data Notes

- **Live Data**: Calls to `https://openrouter.ai/api/v1/models` with a 12s timeout.
- **Caching**: Responses are cached in-memory per session; use the **Refresh data** button to refetch.
- **Fallback Data**: If the live call fails, the bundled `public/models-sample.json` seed dataset is loaded and a warning banner is shown.
- **Data Processing**:
    - `services/modelService.ts`: Handles fetching raw data from API or fallback file.
    - `lib/modelTransforms.ts`: Processes raw data, calculates metrics (price ranges, context ranges), normalizes model objects, and computes a 1-5 composite rating for each model.
    - `lib/modelFilters.ts`: Processes the normalized model list based on user-selected filters and sorting criteria.