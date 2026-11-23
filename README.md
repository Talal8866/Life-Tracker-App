# Life Tracker — Project Overview

## At a glance

Life Tracker is a personal productivity and wellbeing web app that brings daily routines, reflection, and progress tracking into one place. It is designed for quick everyday use on desktop or mobile, with a calm interface and focused views for the day, weekly progress, learning, archive, and finances.

## The need

Many people track routines, wellbeing, goals, and spending across separate notes and apps. Life Tracker offers one lightweight place to record these habits and review patterns over time.

## Key capabilities

- Daily planning and timeline, with progress check-ins
- Prayer, wellbeing, focus, and routine tracking
- Weekly summaries, history, and learning goals
- Personal finance logging
- Local use with optional account sign-in and cross-device sync
- JSON backup and restore for user-controlled portability

## Professional value

The project demonstrates product thinking across a complete user workflow: capturing daily activity, turning it into useful summaries, protecting personal records, and making data portable. It also shows responsive interface design and integration with a managed cloud backend.

## Technology

- Single-page web app built with HTML, CSS, and native JavaScript ES modules
- No bundler or runtime package dependencies
- GitHub Pages for the live static site
- Firebase Authentication for email/password accounts
- Cloud Firestore for authenticated cross-device data sync

## Data and privacy

The app can be used with data stored locally on the device. When a user signs in, the app syncs their records to Firestore. Security rules restrict access to each authenticated user's own data. Users can download a JSON backup and restore it later. As with any cloud service, users should protect their account credentials and backups.

## Example client conversation

**Challenge:** Keep personal routines, daily notes, progress, and spending organized without juggling multiple tools.

**Approach:** Provide a focused tracker with quick daily entry, weekly review, optional cloud sync, and backup/restore.

**Outcome:** A single responsive app supports both everyday tracking and longer-term reflection, while allowing users to retain a portable copy of their data.

## Possible next steps

Potential future improvements include clearer onboarding, more guided reports, and additional accessibility and usability refinements based on user feedback.

## Source layout

- `index.html` contains the page shell and module entry point.
- `css/app.css` contains the application styles.
- `js/main.js` starts the app; `js/app.js` coordinates state and connects application modules.
- `js/core/` holds shared configuration, date/format helpers, app state, app context, and local persistence.
- `js/domain/` holds the tracker state schema, normalization/migration rules, scoring model, and weekly metrics.
- `js/actions/` holds delegated click and change handlers, keeping action workflows out of the coordinator.
- `js/services/` contains Firebase authentication/transport, Firestore sync, and Composio integrations.
- `js/ui/screens/` contains one renderer module for each major screen; `js/ui/screen-registry.js` connects them to navigation.

## Run locally

Serve the project directory over HTTP, then open the server URL in a browser. For example, from the project directory run `npx serve .` or use another static file server. Native ES modules require HTTP serving and do not load when opening `index.html` directly as a `file://` URL.
