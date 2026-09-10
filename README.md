# Time Blocking Calendar

A weekly time-blocking calendar built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- Shows seven consecutive days beginning today.
- Hour-based calendar grid with 15-minute snapping.
- Create an event by dragging an empty time range.
- Move an event across times and days by dragging it.
- Displays overlapping events side by side.
- Click an event to view its details.
- Right-click an event to edit or delete it.
- Validates event title and start/end time before saving.
- Confirms deletion before removing an event.
- Responsive dark UI with a custom scrollbar.

## Requirements

- Node.js 20 or newer
- npm

## Getting started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build the production bundle:

```bash
npm run build
```

## Available scripts

| Command                 | Description                                                                   |
| ----------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`           | Starts the Vite development server.                                           |
| `npm run build`         | Type-checks and builds the production bundle.                                 |
| `npm run preview`       | Serves the production build locally.                                          |
| `npm run lint`          | Runs ESLint.                                                                  |
| `npm run test`          | Runs the complete unit test suite once.                                       |
| `npm run test:watch`    | Runs the unit test suite in watch mode.                                       |
| `npm run test:coverage` | Runs unit tests with coverage gates and writes an HTML report to `coverage/`. |
| `npm run cypress:open`  | Opens the Cypress desktop runner.                                             |
| `npm run cypress:run`   | Runs Cypress E2E tests against an available dev server.                       |
| `npm run typecheck:e2e` | Type-checks Cypress configuration and E2E specs.                              |
| `npm run test:e2e`      | Starts Vite, waits for it, then runs the Cypress E2E suite.                   |
| `npm run format`        | Formats supported project files with Prettier.                                |
| `npm run format:check`  | Checks formatting without modifying files.                                    |

## Calendar interactions

- Drag over an empty day column to create an event.
- Drag an existing event to move it while preserving its duration.
- Left-click an event to open its detail dialog.
- Right-click an event to open the Edit/Delete menu.
- Use Add event in the header to create a one-hour event at the next 15-minute interval.

## Testing

Unit tests cover the date/time helpers, event layout, event state, drag-to-create,
drag-to-move, and Escape-key behavior. They are located in `tests/unit/`.

Coverage applies to the core hooks and utilities, with the following required
minimums:

| Metric     | Minimum |
| ---------- | ------- |
| Lines      | 80%     |
| Statements | 80%     |
| Functions  | 80%     |
| Branches   | 75%     |

## Project structure

```text
src/
  components/
    calendar/  # Calendar shell, grid, header, day columns, and time axis
    dialogs/   # Create, edit, detail, and delete-confirmation dialogs
    event/     # Event blocks and their context menu
  constants.ts # Shared calendar configuration
  hooks/       # Event state and drag interactions
  types/       # Shared TypeScript models
  utils/       # Date/time and event layout helpers
tests/
  unit/        # Hook and utility unit tests
```
