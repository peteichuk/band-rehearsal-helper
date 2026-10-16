# 🎵 Band Rehearsal Helper

A lightweight, **no-build** web utility designed for musical bands to manage repertoire, view chords, and rehearse efficiently. This tool uses a publicly accessible **Google Sheet** as a database, making it easy to update song lists without touching the code.

### 🔗 Live Demo / Example

Demo: [https://peteichuk.github.io/band-rehearsal-helper/#/?tableId=1v3vPgo1TT92YsecQx-cXwYsEqV-uAmItvrdmZLZqVTQ](https://peteichuk.github.io/band-rehearsal-helper/#/?tableId=1v3vPgo1TT92YsecQx-cXwYsEqV-uAmItvrdmZLZqVTQ)

Website URL: [https://peteichuk.github.io/band-rehearsal-helper/](https://peteichuk.github.io/band-rehearsal-helper/)

Grid URL: [https://docs.google.com/spreadsheets/d/1v3vPgo1TT92YsecQx-cXwYsEqV-uAmItvrdmZLZqVTQ/edit](https://docs.google.com/spreadsheets/d/1v3vPgo1TT92YsecQx-cXwYsEqV-uAmItvrdmZLZqVTQ/edit?gid=0#gid=0)

## 🚀 Features

- **No-Build & Serverless:** Pure HTML/JS/CSS. No complex build steps or backend servers required.
- **Google Sheets as DB:** Manage your songs in a spreadsheet; updates are reflected instantly in the app.
- **Smart Chord Parsing:** Supports dynamic chord parsing from text, allowing for future transposition features.
- **Pinned Songs:** Songs marked `PinedByDefault` in the sheet are pinned to the top of the list for everyone. Anyone can locally pin/unpin any song from the UI — this only changes sort order for you, it's never written back to the sheet.
- **Favorites & Setlists:** Star any song locally to build your own setlist — this is what the prev/next navigation on a song page cycles through. Until you star anything, prev/next falls back to the pinned songs by default.
- **External Resource Integration:** Quick links to **YouTube**, **Chordify**, and **Holychords**.
- **Auto Dark Mode:** Built-in responsive design that respects your OS light/dark theme settings.
- **Mobile Friendly:** Fully responsive UI, perfect for smartphones on a music stand.
- **Metronome:** Integrated metronome to help keep time during practice. Preselects BPM and time signature from the song data (`BPM`, `TimeSignature`).
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
- **Admin Mode (Google Sign-In):** Sign in with Google; if your account has edit access to the sheet, an "Add Song" button and a per-song edit (pencil) icon appear, letting you create/update songs directly from the app.
- **Line & Label Notes:** Tap any lyric/chord line, or a section label like "Chorus"/"Intro", to attach a personal cue (e.g. "I come in here"). The note shows up right away, inline under the line or label. Stored locally in your browser only, per device; never written to the shared Google Sheet.
- **Albums (Custom Setlists):** Build your own local playlists from any songs in the catalog, switching between List/Albums from the bottom tab bar. Open an album to browse, add, or remove songs; opening a song from inside one makes prev/next cycle that album's own order instead of your favorites. Share a single album as a JSON file, or import one a bandmate sent you (with a replace/cancel prompt if you already have an album by that name).
- **Drag & Drop Song Ordering:** Inside an album, pick a song up by its grip handle and drag it to a new spot — the other songs slide out of the way live, and the order is only actually committed once you let go. You can also just type a position number into a song's row to jump it straight there.
- **Song Overflow Menu:** A "⋮" menu on every song row (in the list and on the song page) puts Edit, Labels, and Add to album in one place — inside an album it also offers Remove from this album.
- **Swipe to Delete:** Telegram-style swipe-left gesture on an album or a song inside an album reveals a delete button, so removing something is a quick one-handed swipe-then-tap instead of hunting for a menu.
- **Appearance Settings:** Set your preferred font size and column layout from Settings, remembered separately for portrait and landscape, with a live preview as you adjust. Zooming or changing columns on an individual song's own page only overrides that one song, leaving your global default untouched.
- **Settings Backup (Import/Export):** Export your local data — Favorites, Pinned overrides, Tags, Tonality/Capo choices, Line notes, Albums, and Appearance defaults — as a single JSON file, choosing exactly which categories to include. Importing reads the file first and only lets you enable categories it actually contains, merging with whatever you already have rather than overwriting it.

## 📊 Data Structure (Google Sheets)

To ensure the application works correctly, your Google Sheet should include the following columns:

| Column              | Type      | Description                                                                                                                                                                     |
| :------------------ | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Name**            | `string`  | The song title (searchable). **Required.**                                                                                                                                      |
| **PinedByDefault**  | `boolean` | Mark as TRUE to pin the song to the top of the list by default for everyone. Anyone can still locally override this (pin/unpin for themselves) without changing the sheet.      |
| **Language**        | `string`  | The language of the lyrics.                                                                                                                                                     |
| **Tonality**        | `string`  | The original key of the song.                                                                                                                                                   |
| **BPM**             | `number`  | Temp BPM.                                                                                                                                                                       |
| **TimeSignature**   | `string`  | Time signature as a musician would write it, e.g. `4/4`, `3/4`, `6/8`. Preselects the metronome's time signature for the song; defaults to `4/4` if left blank or unrecognized. |
| **Text**            | `string`  | Lyrics with chords (use spaces between chords for proper parsing). **Required.**                                                                                                |
| **Holychords**      | `url`     | Link to the song on Holychords.                                                                                                                                                 |
| **YouTube**         | `url`     | Link to a reference video or backing track.                                                                                                                                     |
| **Chordify**        | `url`     | Link to the Chordify page.                                                                                                                                                      |
| **GroupBy**         | `any`     | Used for filtering (e.g., "Acoustic Set", "Sunday Service").                                                                                                                    |
| **SortingPriority** | `number`  | Among pinned songs (see `PinedByDefault` above), this controls their order.                                                                                                     |

> **Note:** For the chord transposition engine to work, ensure there are clear spaces between chord symbols in the `Text` field.
>
> **Note:** Column names are read dynamically from your sheet's header row — if you rename, add, or remove a column, the app (including the admin "Add Song"/edit form) picks it up automatically. `PinedByDefault`, `Text`, and a few others are only special-cased for their input type/behavior; any other column just becomes a plain text field.

## 🛠 Roadmap

- [x] UI Admin with CRUD. Auth by Google then easy add/edit songs directly from the Google Sheets for APP. (delete not yet implemented)
- [x] Implementation of advanced filtering and searching by the `GroupBy` field.
- [ ] Wake lock for (IOS, Android).

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features or improvements:

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## Available Scripts

### `npm run dev`

Starts a lightweight development server using `http-server`. This serves the current directory (`./`) with caching disabled and automatically opens the browser. Useful for quickly previewing the project during development.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Created by **Michael Peteichuk** — [michael.peteichuk@gmail.com](mailto:michael.peteichuk@gmail.com)
