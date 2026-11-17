# Life Tracker — Quick User Guide

## Getting started

Open the Life Tracker website. You can start using it on the current device without an account. Your daily entries are saved on that device.

## Main areas

- **Now:** See today's overview and mark items as complete.
- **Log:** Record daily routines and wellbeing details; use the date controls to review another day.
- **Week:** Review progress and summaries for the week.
- **Learn:** Track learning goals and study progress.
- **Archive:** Browse past records and summaries.
- **Adhkar:** Access and track adhkar.
- **Money:** Record and review personal income and spending.
- **Settings:** Adjust targets and preferences, and manage account and data options.

## Sync across devices

In **Settings → Your data**, create an account or sign in with email and password. Once connected, the app syncs your records to your account. Use **Sync now** if you want to request a sync manually. Look for **Synced across your devices** as the status.

## Back up or restore

In **Settings → Your data**:

- Choose **Download backup** to save a JSON copy of your tracker data.
- Choose **Restore** and select a backup file to load it.

Restore replaces the data currently on the device. Download a fresh backup first if you want to preserve the current version.

## Firebase data

Signed-in data is stored in Cloud Firestore, partitioned into documents under the user's account. For everyday changes, use the Life Tracker app; direct edits in Firebase Console can conflict with device sync. Keep the existing Firestore security rules enabled.

## If sync is not working

Check your internet connection, confirm you are signed into the intended account, and use **Sync now**. Wait for the status to update. If an error continues, note the message and check Firebase Authentication and Firestore configuration.
