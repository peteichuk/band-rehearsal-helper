# 🎵 Band Rehearsal Helper

A lightweight web utility designed for musical bands to manage repertoire, view chords, and rehearse efficiently. Built with **React**, **TypeScript**, and **Vite**. This tool uses a publicly accessible **Google Sheet** as a database, making it easy to update song lists without touching the code — either by editing the sheet directly, or, if you're signed in with edit access, by adding/editing songs right from the app's UI (see **Admin Mode** below).

### 🔗 Live Demo / Example

Website: [https://peteichuk.github.io/band-rehearsal-helper/landing.html](https://peteichuk.github.io/band-rehearsal-helper/landing.html)

Demo: [https://peteichuk.github.io/band-rehearsal-helper/#/?tableId=1v3vPgo1TT92YsecQx-cXwYsEqV-uAmItvrdmZLZqVTQ](https://peteichuk.github.io/band-rehearsal-helper/#/?tableId=1v3vPgo1TT92YsecQx-cXwYsEqV-uAmItvrdmZLZqVTQ)

Google Sheets example: [https://docs.google.com/spreadsheets/d/1v3vPgo1TT92YsecQx-cXwYsEqV-uAmItvrdmZLZqVTQ/edit](https://docs.google.com/spreadsheets/d/1v3vPgo1TT92YsecQx-cXwYsEqV-uAmItvrdmZLZqVTQ/edit?gid=0#gid=0)

## 🚀 Features

> For details on how any of this works, see the **[FAQ](https://peteichuk.github.io/band-rehearsal-helper/faq.html)**.

- **Serverless:** Static Vite app on GitHub Pages — no backend.
- **Google Sheets as DB:** Manage songs in a spreadsheet; changes show up instantly.
- **Smart Chord Parsing & Transposition:** Parses chords from text, transposes to any key.
- **Pinned Songs & Favorites:** Sheet-wide pins, plus your own local favorites and prev/next navigation.
- **Smart Search:** Fuzzy search across names, lyrics, labels, groups, language, and setlists.
- **External Links:** Quick links to YouTube, Chordify, and Holychords.
- **Auto Dark Mode:** Follows your OS light/dark theme.
- **Multilingual UI:** English + 7 more languages, lazy-loaded.
- **Mobile Friendly:** Fully responsive, installable as a PWA.
- **Metronome:** Built-in Web Audio metronome with per-song presets, accent patterns, custom audio output device, an optional visual beat flash (screen-edge glow), a needle that swings in time with the beat, keeps running when you switch songs (stops if the next one has no BPM), and configurable defaults (click sound, tempo, time signature) for songs without their own.
- **Play Mode:** A stage view for a song — toolbar tucked away until you tap, big hold-to-confirm prev/next buttons, a big metronome play/pause, and auto-scroll. Songs opened from a setlist are numbered (`№3/12`).
- **Chord Diagrams:** Tap a chord to see its guitar, ukulele, or piano diagram; optionally list every chord of the song below it, with adjustable size and defaults in Settings.
- **Works Offline:** Once loaded, keeps working without a signal.
- **Flexible Layout:** Split lyrics into columns, hide chords/text, adjust font size.
- **Admin Mode (Google Sign-In):** Add/edit songs directly from the app if you have edit access.
- **Line & Label Notes:** Personal cues on any line, stored locally per device.
- **Setlists:** Build, drag-and-drop reorder, import/export, and share custom song lists.
- **Settings Backup:** Export/import your local data (including appearance, chord-diagram and metronome preferences) as a JSON file.
- **Print, Copy & Share:** Clean print styles, copying a song's text, plus sharing a song or a filtered list.

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
- [ ] Wake lock for (IOS, Android): partially implemented (Screen Wake Lock API plus a hidden-video fallback), but as a browser app it is heavily limited by the OS/browser and doesn't work reliably yet.
- [ ] Sync local data (Favorites, Pinned, Setlists, Notes, Appearance) between devices.
- [ ] Auto-scroll pacing: a basic speed-level auto-scroll exists in Play mode; still to do — pace it to the song's BPM or track duration.
- [ ] Bluetooth pedal / page-turner support (e.g. AirTurn, iRig BlueTurn) via hotkeys (Left/Right, PageUp/PageDown) for hands-free scrolling between pages/songs.
- [x] Big Target Controls (Play mode): a per-song stage view with a tap-to-reveal bar of oversized metronome play/pause and hold-to-confirm prev/next buttons, plus basic auto-scroll.
- [ ] Capo-aware chord display: show chords relative to the capo alongside the real key (e.g. `Real Key: Eb | Capo 1: D`).
- [x] Chord diagrams: tap a chord to see a guitar, ukulele, or piano diagram.
- [x] Visual metronome: flash the whole screen in time with the beat, for when the click can't be heard or isn't wanted out loud.
- [ ] Multi-device live sync (Live Session): a band leader switches songs on their device and everyone else's device follows automatically (WebSockets / peer-to-peer).

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
