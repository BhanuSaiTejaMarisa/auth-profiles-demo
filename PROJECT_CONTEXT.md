# Auth Profiles Demo - Project Context

This document is a fast onboarding guide for humans and AI agents working on this repo in new sessions.

## 1) What This App Is

A React + TypeScript + Vite prototype for managing authorization profiles and their matrix records.

The UI supports three views:
- Split View: profile list (left) + matrix workspace (right)
- Auth Profiles: full-page profile management table
- Profile Matrix: full-page matrix records view with pagination

All data behavior is currently local/mock. There is no real backend integration yet.

## 2) Tech Stack

- React 18
- TypeScript 5
- Vite 4
- MUI 5 (material components + icons)
- Emotion (MUI styling engine)

Project type:
- Single-page app with local state
- No router (tab switch in App component)
- No persistence layer

## 3) Run and Build

Scripts in package.json:
- npm run dev
- npm run build
- npm run preview

## 4) High-Level Architecture

Entry and shell:
- src/main.tsx mounts app
- src/App.tsx provides MUI ThemeProvider and top-level tab navigation
- src/theme/appTheme.ts defines global theme tokens
- src/App.css and src/index.css define layout and utility styles

Domain layers:
- pages/: screen-level orchestration and state
- components/: reusable presentation and local interaction blocks
- hooks/: filtering, pagination, modal, and data-fetch hooks
- services/: business/data operations
- data/: static mock data and option lists
- types.ts: shared domain types

## 5) Primary Views

### Split View
File: src/pages/SplitViewPage.tsx

Purpose:
- Side-by-side profile and matrix workflow
- Uses local in-memory state for profiles and matrix rows

Main mechanics:
- Profile filtering via useProfileFiltering
- Client pagination via usePagination
- Matrix scoping/filtering/grouping via useMatrixFiltering
- Add/filter modal orchestration via useModalOperations
- Mutations via ProfileService and MatrixService

### Auth Profiles Page
File: src/pages/ProfilesPage.tsx

Purpose:
- Full-page profile management with search, selection, and pagination

Main mechanics:
- Local profile + matrix state
- Search and active filter
- Add/delete/filter via modal and ProfileService

### Profile Matrix Page
File: src/pages/MatrixPage.tsx

Purpose:
- Matrix-centric page with profile-code multiselect and paginated record display

Main mechanics:
- Data comes from useMatrixData (mock API simulation)
- API shape adapted to UI MatrixRecord shape with adaptApiRecord
- Grouped by authProfileCode for table sections
- Selection-driven bulk edit form seed
- Delete/update actions are currently mocked messaging (not persisted)

## 6) Data Model (Core Types)

File: src/types.ts

Important types:
- Profile: profile master row
- MatrixRecord: matrix workspace row used by UI components
- ModalFormState: multi-select criteria used by add/filter modal
- BulkEditFormState: editable matrix attributes for batch update
- ModalState: modal mode + scope + form payload

## 7) Services and Data Flow

### ProfileService
File: src/services/ProfileService.ts
- deleteProfiles: deletes selected profiles and cascades matrix row deletion by authProfileCode
- getSelectedProfiles / getSelectedMatrixRecords helpers

### MatrixService
File: src/services/MatrixService.ts
- deleteMatrixRecords: removes selected rows from local state
- applyBulkEdit: applies form values across selected matrix records

### MatrixApiService
File: src/services/MatrixApiService.ts
- Generates deterministic mock records on demand
- Simulates large dataset (103,929 total possible records)
- Filters by auth profile code and paginates
- Used by useMatrixData hook

### useMatrixData Hook
File: src/hooks/useMatrixData.ts
- Wraps MatrixApiService calls
- Simulates async latency using setTimeout
- Returns records, total, page, totalPages, loading/error state, and setPage

## 8) Components (Reusable Building Blocks)

Common:
- src/components/ActionToolbar.tsx: configurable action buttons by action kind
- src/components/ProfileActionModal.tsx: add/filter modal with option groups
- src/components/MatrixGroupSection.tsx: grouped matrix table per auth profile
- src/components/BulkEditPanel.tsx: batch edit form for selected rows

Split-view-specific wrappers:
- src/components/panels/ProfilesPanel.tsx
- src/components/panels/MatrixPanel.tsx

## 9) Mock Data and Options

- src/data/mockData.ts holds:
  - option lists for region/subregion/country/business values
  - default modal form values
  - initial profile dataset
  - initial matrix dataset
- src/data/mockMatrixData.json exists but may be too large for some tooling workflows
- convert-csv.js is a one-off script for converting an external CSV to JSON

## 10) Current Behavior and Limitations

- No backend/API integration yet
- No persistent storage; refresh resets state
- Some actions intentionally mocked with snackbar messages only
- MatrixApiService.getRecords scans/generates across totalRecordCount per fetch; good for prototype realism, but potentially expensive for production
- App currently uses tab state instead of route-based URLs

## 11) Safe Change Guidelines for Future Agents

When making updates, prefer:
- Keep domain logic in services/hooks, not deeply inside JSX
- Reuse existing shared types in src/types.ts
- Preserve current MUI + CSS layout conventions unless redesign is intentional
- Keep mock-vs-real boundaries clear (especially in MatrixPage)

If implementing real backend:
- Replace MatrixApiService with HTTP client service
- Keep useMatrixData public contract stable to minimize page/component churn
- Introduce typed DTO adapters at service boundary (like current adaptApiRecord pattern)

## 12) Quick File Map

Core:
- src/App.tsx
- src/main.tsx
- src/types.ts

Pages:
- src/pages/SplitViewPage.tsx
- src/pages/ProfilesPage.tsx
- src/pages/MatrixPage.tsx

Hooks:
- src/hooks/useProfileFiltering.ts
- src/hooks/useMatrixFiltering.ts
- src/hooks/usePagination.ts
- src/hooks/useModalOperations.ts
- src/hooks/useMatrixData.ts

Services:
- src/services/ProfileService.ts
- src/services/MatrixService.ts
- src/services/MatrixApiService.ts

UI Components:
- src/components/ActionToolbar.tsx
- src/components/ProfileActionModal.tsx
- src/components/MatrixGroupSection.tsx
- src/components/BulkEditPanel.tsx
- src/components/panels/ProfilesPanel.tsx
- src/components/panels/MatrixPanel.tsx

Styling:
- src/theme/appTheme.ts
- src/App.css
- src/index.css

## 13) Suggested Prompt for New AI Sessions

Use this when handing off to another agent:

"Read PROJECT_CONTEXT.md first, then inspect the relevant files for the requested task. Keep existing architecture and type contracts unless change is required. Mention any mocked behavior you modify."

