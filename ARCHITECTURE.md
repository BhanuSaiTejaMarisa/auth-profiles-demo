# Authorization Profiles Demo - Architecture Overview

## High-Level Design

This app manages two related data models:
1. **Generic Authorization Profiles**: Reusable role definitions
2. **Authorization Matrix**: Detailed rules (region, country, business, approval thresholds, etc.) linked to profiles

The UX intelligently adapts based on user intent through two mutually-exclusive filter modes.

---

## Filter Modes

### Profile Code Mode (Grouped View)
**When activated**: User selects one or more Profile Codes.

**Behavior**:
- Returns all matching matrix rules for selected profiles.
- Results capped at 3000 rows for UI smoothness.
- Rows grouped by Auth Profile Code in collapsible sections.
- Each section uses virtualized row rendering (renders only visible rows + small buffer).
- No pagination controls (all loaded data is visible via scrolling).

**Why this approach**:
- PM/PO typically reviews by profile when approving changes.
- Grouped context helps users see all rules for a single profile together.
- Capping prevents DOM overload while still showing rich detail.
- Virtualization enables smooth scrolling even with hundreds of rows per profile.

**When to use**: Approval workflows, profile-specific audits, bulk edits within a profile.

---

### Broad Filter Mode (Flat Table View)
**When activated**: User sets Region, Sub-Region, Country, Business Group, or Business Unit filters (with NO Profile Codes selected).

**Behavior**:
- Returns matching matrix rules across ALL profiles.
- Results use server-side pagination (default 200 rows per page).
- Rows displayed in a flat, sortable table.
- Pagination controls appear at bottom.

**Why this approach**:
- Broad queries can return very large result sets (thousands to tens of thousands).
- Pagination keeps client memory and rendering fast.
- Flat layout is familiar and scalable for exploration.

**When to use**: Cross-profile analysis, regional compliance checks, finding duplicates, troubleshooting.

---

## Filter Logic

**Within a mode, filters follow AND semantics**:
- Profile Code + Region = rows matching BOTH.
- Region + Country + Business Group = rows matching ALL three.

**Between modes**:
- Switching from one mode to another automatically clears the previous mode's filters.
- A confirmation dialog explains the switch to prevent accidental data loss.

---

## Data Loading Strategy

### Server-Side
- **Endpoint**: `GET /matrix?profileCode=...&region=...&page=...&pageSize=...`
- **Logic**: Custom route handler (not standard json-server) filters in-memory dataset, applies mode logic, and returns results.
- **Fallback**: If server is unavailable, frontend falls back to local mock data service with same filter logic.

### Client-Side
- **Hook**: `useMatrixData` wraps server request, handles loading state, errors, and fallback.
- **Local mutations**: Delete and Bulk Edit operations happen in React state (not persisted to backend yet).
- **Re-fetch**: Filter changes trigger automatic data refresh from server.

---

## UI Rendering

### Grouped Mode (Profile Code)
- MatrixGroupSection component renders each profile as a collapsible Paper.
- Within each section, rows are virtualized with react-window FixedSizeList.
- User can expand/collapse groups and select rows for bulk actions.

### Flat Mode (Broad Filters)
- Standard Material-UI Table with sticky header.
- Rows are standard DOM (pagination ensures reasonable count).
- User can paginate between result pages.

---

## Export Scoping

### Profiles Page
- **Export Selected**: Exports only checked profiles as CSV (client-side generation).
- **Export All Profiles**: Exports all profiles in the database as CSV (client-side generation).
- Use case: Share profile definitions with other teams.

### Matrix Page - Grouped Mode
- **Export Filtered**: Applies same filters used to load grouped data, exports all matching rows across all selected profiles.
- **Export All Matrix**: Exports the entire matrix dataset (all profiles, all rules).
- Use case: Compliance reporting, data migration, backups.

### Matrix Page - Broad Mode
- **Export Filtered**: Applies same broad filters, exports matching rows.
- **Export All Matrix**: Same as grouped mode.
- Use case: Regional compliance, audit trails.

All exports are CSV format for compatibility.

---

## Performance Characteristics

| Scenario | Strategy | Reason |
|----------|----------|--------|
| Select 1-5 profiles | Grouped, virtualized | Small result sets stay responsive. |
| Select 10+ profiles | Grouped, capped warning | Prevents DOM overload; user refines filters. |
| No profile, broad filters | Paginated flat table | Can return large sets; pagination keeps client responsive. |
| Export large result set | Server-side CSV | Avoids hanging the browser. |
| Scroll 1000+ rows | Virtualization | Only renders visible rows; smooth UX. |

---

## Decision Checkpoints for PM/PO

1. **Is result set small (< 500 rows)?** → Can show grouped or flat.
2. **Is result set large (> 5000 rows)?** → Must use pagination.
3. **Does user need to compare across profiles?** → Use grouped mode.
4. **Does user need to find patterns across all data?** → Use broad + pagination.
5. **Does user need to export for external use?** → Server-side CSV avoids client memory spike.

---

## Known Limitations (Phase 1)

- Filters and deletes are local to session (not persisted to backend).
- No undo/redo.
- No advanced sorting by columns.
- No saved filter presets.

These can be added in Phase 2 after backend persistence is in place.
