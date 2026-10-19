# 🎵 Band Rehearsal Helper

A lightweight web utility designed for musical bands to manage repertoire, view chords, and rehearse efficiently. Built with **React**, **TypeScript**, and **Vite**. This tool uses a publicly accessible **Google Sheet** as a database, making it easy to update song lists without touching the code — either by editing the sheet directly, or, if you're signed in with edit access, by adding/editing songs right from the app's UI (see **Admin Mode** below).

### 🔗 Live Demo / Example

Website: [https://peteichuk.github.io/band-rehearsal-helper/landing.html](https://peteichuk.github.io/band-rehearsal-helper/landing.html)

Demo: [https://peteichuk.github.io/band-rehearsal-helper/#/?tableId=1v3vPgo1TT92YsecQx-cXwYsEqV-uAmItvrdmZLZqVTQ](https://peteichuk.github.io/band-rehearsal-helper/#/?tableId=1v3vPgo1TT92YsecQx-cXwYsEqV-uAmItvrdmZLZqVTQ)

Google Sheets example: [https://docs.google.com/spreadsheets/d/1v3vPgo1TT92YsecQx-cXwYsEqV-uAmItvrdmZLZqVTQ/edit](https://docs.google.com/spreadsheets/d/1v3vPgo1TT92YsecQx-cXwYsEqV-uAmItvrdmZLZqVTQ/edit?gid=0#gid=0)

## 🚀 Features

- **Serverless:** No backend required — the app is a static bundle, built with Vite and deployed to GitHub Pages.
- **Google Sheets as DB:** Manage your songs in a spreadsheet; updates are reflected instantly in the app.
- **Smart Chord Parsing:** Supports dynamic chord parsing from text, allowing for future transposition features.
- **Pinned Songs:** Songs marked `PinedByDefault` in the sheet are pinned to the top of the list for everyone. Anyone can locally pin/unpin any song from the UI — this only changes sort order for you, it's never written back to the sheet.
- **Favorites:** Star any song locally to build your own favorites list — this is what the prev/next navigation on a song page cycles through. Until you star anything, prev/next falls back to the pinned songs by default.
- **External Resource Integration:** Quick links to **YouTube**, **Chordify**, and **Holychords**.
- **Auto Dark Mode:** Built-in responsive design that respects your OS light/dark theme settings.
- **Mobile Friendly:** Fully responsive UI, perfect for smartphones on a music stand.
- **Metronome:** Integrated metronome to help keep time during practice. Preselects BPM and time signature from the song data (`BPM`, `TimeSignature`), with a built-in local engine or a switchable guitarapp.com embed. Supports simple (2/4–5/4), complex (5/8, 7/8, 8/8, 10/8, 11/8, 13/8), and compound (6/8, 6/8 ♩., 9/8, 9/8 ♩., 12/8, 12/8 ♩.) time signatures, clicking every eighth note at its correct note-value-scaled interval for `/8` meters rather than treating them like `/4`. The `♩.` variants click the same beats as their plain counterpart but default to a triplet accent grouping (e.g. 3+3+3+3 for 12/8) instead of a plain first-beat accent. Pick any accent pattern the time signature offers (Off, On, or a meter-specific grouping like 3+3+2+2+2) from its own selector; your choice, along with tempo and time signature, is remembered per song (a "metronome preset") and shared between the local and embedded engines.
- **Audio Output Device:** Pick which output device the metronome's local engine plays its clicks through — e.g. a USB audio interface or a Bluetooth speaker — instead of your system default, from the speaker icon in the metronome or from Settings. Chromium-only (Chrome/Edge, desktop or Android). If the picked device isn't currently connected, playback falls back to the system default and flags that both in the device picker and in Settings; if it connects or disconnects again while the metronome is already playing, sound automatically redirects to it (or stops, if it's genuinely gone, rather than silently playing through the wrong speaker).
- **As Mobile App:** Installable as a Native App on iOS and Android devices. Choose "Add to Home Screen" from your browser menu.
- **Print:** Simple print styles for physical copies of lyrics and chords.
- **Share:** Share specific songs or filtered lists.
- **Transpose Chords:** Enhancing the chord parser to allow one-click transposition.
- **Working in Offline:** Once loaded, the app can function offline (except for fetching new data from Google Sheets).
- **Split by Columns:** View song in separate columns (e.g., Verse, Chorus).
- **Wake lock:** Wake lock for desktop PC (for mobile not possible temporary).
- **Toggle Show/Hide Chords:** Option to hide chords for a cleaner view of the lyrics.
- **Toggle Show/Hide Text:** Option to hide lyrics for a focus on chords only.
- **Sorting Priority:** Among pinned songs, `SortingPriority` controls the order (lower first); unpinned songs stay alphabetical.
- **Navigation between favorite songs:** Open a song and use the prev/next buttons (or swipe) to move through your favorites — or, by default, through the pinned songs until you've starred your own.
- **Admin Mode (Google Sign-In):** Sign in with Google; if your account has edit access to the sheet, an "Add Song" button and a per-song edit (pencil) icon appear, letting you create and update songs directly from the app — no need to open the spreadsheet. Deleting a song from the sheet via the UI isn't implemented yet; do that directly in the sheet for now.
- **Line & Label Notes:** Tap any lyric/chord line, or a section label like "Chorus"/"Intro", to attach a personal cue (e.g. "I come in here"). The note shows up right away, inline under the line or label. Stored locally in your browser only, per device; never written to the shared Google Sheet.
- **Setlists (Custom Song Groups):** Build your own local playlists from any songs in the catalog, switching between Library/Setlists from the bottom tab bar. Open a setlist to browse, add, or remove songs; opening a song from inside one makes prev/next cycle that setlist's own order instead of your favorites. Adding songs always appends them at the end of the list, never sorts them in.
- **Setlist Import/Export:** Share a single setlist via its row's icon, or select several from the Setlists page (Export → checkboxes appear → Cancel/Export) to bundle them into one file — optionally also including Line/label notes, Tonality/Capo choices, and Metronome presets for just the songs in those setlists (all off by default). Importing a file with a name that already exists on this device asks Cancel / Merge / Replace per setlist, with an "Apply for all" option to reuse that answer for the rest of the file; Cancel aborts the whole import. Merge adds the imported songs/data on top of what's already there, letting the imported value win only where something overlaps.
- **Drag & Drop Song Ordering:** Inside a setlist, pick a song up by its grip handle and drag it to a new spot — the other songs slide out of the way live, and the order is only actually committed once you let go. You can also just type a position number into a song's row to jump it straight there.
- **Song Overflow Menu:** A "⋮" menu on every song row (in the Library and on the song page) puts Edit, Labels, and Add to setlist in one place — inside a setlist it also offers Remove from this setlist.
- **Swipe to Delete:** Telegram-style swipe-left gesture on a setlist or a song inside a setlist reveals a delete button, so removing something is a quick one-handed swipe-then-tap instead of hunting for a menu.
- **Appearance Settings:** Set your preferred font size and column layout from Settings, remembered separately for portrait and landscape, with a live preview as you adjust. Zooming or changing columns on an individual song's own page only overrides that one song, leaving your global default untouched.
- **Settings Backup (Import/Export):** Export your local data — Favorites, Pinned overrides, Tags, Tonality/Capo choices, Line notes, Setlists, Appearance defaults, and Metronome presets — as a single JSON file, choosing exactly which categories to include. Importing reads the file first and only lets you enable categories it actually contains, merging with whatever you already have rather than overwriting it.

## 📊 Data Structure (Google Sheets)

Songs can be managed two ways: by editing the Google Sheet directly, or — if you're signed in with an account that has edit access to it — by using the "Add Song" button and per-song edit (pencil) icon right in the app (see **Admin Mode** above). Either way, the sheet stays the single source of truth, so your columns should match the structure below.

To ensure the application works correctly, your Google Sheet should include the following columns:

| Column              | Type      | Description                                                                                                                                                                                                                                                                            |
| :------------------ | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**            | `string`  | The song title (searchable). **Required.**                                                                                                                                                                                                                                             |
| **PinedByDefault**  | `boolean` | Mark as TRUE to pin the song to the top of the list by default for everyone. Anyone can still locally override this (pin/unpin for themselves) without changing the sheet.                                                                                                             |
| **Language**        | `string`  | The language of the lyrics.                                                                                                                                                                                                                                                            |
| **Tonality**        | `string`  | The original key of the song.                                                                                                                                                                                                                                                          |
| **BPM**             | `number`  | Temp BPM.                                                                                                                                                                                                                                                                              |
| **TimeSignature**   | `string`  | Time signature as a musician would write it: `2/4`, `3/4`, `4/4`, `5/4`, `5/8`, `6/8`, `6/8 ♩.`, `7/8`, `8/8`, `9/8`, `9/8 ♩.`, `10/8`, `11/8`, `12/8`, `12/8 ♩.`, or `13/8`. Preselects the metronome's time signature for the song; defaults to `4/4` if left blank or unrecognized. |
| **Text**            | `string`  | Lyrics with chords (use spaces between chords for proper parsing). **Required.**                                                                                                                                                                                                       |
| **Holychords**      | `url`     | Link to the song on Holychords.                                                                                                                                                                                                                                                        |
| **YouTube**         | `url`     | Link to a reference video or backing track.                                                                                                                                                                                                                                            |
| **Chordify**        | `url`     | Link to the Chordify page.                                                                                                                                                                                                                                                             |
| **GroupBy**         | `any`     | Used for filtering (e.g., "Acoustic Set", "Sunday Service").                                                                                                                                                                                                                           |
| **SortingPriority** | `number`  | Among pinned songs (see `PinedByDefault` above), this controls their order.                                                                                                                                                                                                            |

> **Note:** For the chord transposition engine to work, ensure there are clear spaces between chord symbols in the `Text` field.
>
> **Note:** Column names are read dynamically from your sheet's header row — if you rename, add, or remove a column, the app (including the admin "Add Song"/edit form) picks it up automatically. `PinedByDefault`, `Text`, and a few others are only special-cased for their input type/behavior; any other column just becomes a plain text field.

## 🛠 Roadmap

- [x] UI Admin with CRUD. Auth by Google then easy add/edit songs directly from the Google Sheets for APP. (delete not yet implemented)
- [x] Implementation of advanced filtering and searching by the `GroupBy` field.
- [ ] Wake lock for (IOS, Android).
- [ ] Sync local data (Favorites, Pinned, Setlists, Notes, Appearance) between devices.
- [ ] Play + auto-scroll the lyrics, paced to the song's tempo.

## 🧰 Development & Build

The project is a React + TypeScript app bundled with **Vite**. Node `^20.x` is required (see `engines` in `package.json`).

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run the dev server:**

   ```bash
   npm run dev
   ```

   Starts Vite's dev server with hot reload. It also binds to `0.0.0.0`, so you can open the printed "Network" URL from another device on the same LAN (e.g. a phone, for testing touch gestures).

3. **Build for production:**

   ```bash
   npm run build
   ```

   Type-checks the project (`tsc -b`) and bundles it with Vite. The output is written to `docs/`, which is what GitHub Pages actually serves — it is **committed to the repository**, not generated by CI.

4. **Preview the production build locally:**

   ```bash
   npm run preview
   ```

### ⚠️ Important: build before you commit/push

Because GitHub Pages serves the `docs/` folder directly from this repo, **the committed `docs/` output must stay in sync with `src/`**. Before committing and pushing any change:

1. Run `npm run build` to regenerate `docs/` from your latest source changes.
2. Stage **both** your source changes and the updated `docs/` folder (`git add src docs ...`).
3. Commit and push as usual.

If you skip the build step, the live site on GitHub Pages will keep serving the old version even though `src/` has changed.

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features or improvements:

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Install dependencies (`npm install`) if you haven't already.
4. Make your changes in `src/`.
5. **Build the project** (`npm run build`) so the `docs/` folder reflects your changes.
6. Commit your changes, including the rebuilt `docs/` folder (`git commit -m 'Add some AmazingFeature'`).
7. Push to the Branch (`git push origin feature/AmazingFeature`).
8. Open a Pull Request.

## Available Scripts

| Script                 | Description                                                                 |
| :--------------------- | :-------------------------------------------------------------------------- |
| `npm run dev`          | Starts the Vite development server with hot reload.                         |
| `npm run build`        | Type-checks the project and builds the production bundle into `docs/`.      |
| `npm run preview`      | Serves the production build from `docs/` locally, for a final sanity check. |
| `npm run format`       | Formats the codebase with Prettier.                                         |
| `npm run format:check` | Checks formatting without writing changes.                                  |

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Created by **Michael Peteichuk** — [michael.peteichuk@gmail.com](mailto:michael.peteichuk@gmail.com)
