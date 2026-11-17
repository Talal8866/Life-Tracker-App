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

- Single-page web app built with HTML, CSS, and JavaScript
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
