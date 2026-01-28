# 🎵 Band Rehearsal Helper

A lightweight, **no-build** web utility designed for musical bands to manage repertoire, view chords, and rehearse efficiently. This tool uses a publicly accessible **Google Sheet** as a database, making it easy to update song lists without touching the code.

### 🔗 Live Demo / Example

Demo: [https://peteichuk.github.io/band-rehearsal-helper/?tableId=1v3vPgo1TT92YsecQx-cXwYsEqV-uAmItvrdmZLZqVTQ](https://peteichuk.github.io/band-rehearsal-helper/?tableId=1v3vPgo1TT92YsecQx-cXwYsEqV-uAmItvrdmZLZqVTQ)

Website URL: [https://peteichuk.github.io/band-rehearsal-helper/](https://peteichuk.github.io/band-rehearsal-helper/)

Grid URL: [https://docs.google.com/spreadsheets/d/1v3vPgo1TT92YsecQx-cXwYsEqV-uAmItvrdmZLZqVTQ/edit](https://docs.google.com/spreadsheets/d/1v3vPgo1TT92YsecQx-cXwYsEqV-uAmItvrdmZLZqVTQ/edit?gid=0#gid=0)

## 🚀 Features

- **No-Build & Serverless:** Pure HTML/JS/CSS. No complex build steps or backend servers required.
- **Google Sheets as DB:** Manage your songs in a spreadsheet; updates are reflected instantly in the app.
- **Smart Chord Parsing:** Supports dynamic chord parsing from text, allowing for future transposition features.
- **Favorites & Setlists:** Mark songs with a star to quickly filter what you need for an upcoming rehearsal or gig.
- **External Resource Integration:** Quick links to **YouTube**, **Chordify**, and **Holychords**.
- **Auto Dark Mode:** Built-in responsive design that respects your OS light/dark theme settings.
- **Mobile Friendly:** Fully responsive UI, perfect for smartphones on a music stand.
- **Metronome:** Integrated metronome to help keep time during practice. Preselect BPM from the song data.
- **As Mobile App:** Installable as a Native App on iOS and Android devices. Choose "Add to Home Screen" from your browser menu.

## 📊 Data Structure (Google Sheets)

To ensure the application works correctly, your Google Sheet should include the following columns:

| Column         | Type      | Description                                                        |
| :------------- | :-------- | :----------------------------------------------------------------- |
| **Name**       | `string`  | The song title (searchable).                                       |
| **Favorites**  | `boolean` | Mark as TRUE to highlight or star the song.                        |
| **Language**   | `string`  | The language of the lyrics.                                        |
| **Tonality**   | `string`  | The original key of the song.                                      |
| **BPM**        | `number`  | Temp BPM.                                                          |
| **Text**       | `string`  | Lyrics with chords (use spaces between chords for proper parsing). |
| **Holychords** | `url`     | Link to the song on Holychords.                                    |
| **YouTube**    | `url`     | Link to a reference video or backing track.                        |
| **Chordify**   | `url`     | Link to the Chordify page.                                         |
| **GroupBy**    | `any`     | Used for filtering (e.g., "Acoustic Set", "Sunday Service").       |

> **Note:** For the chord transposition engine to work, ensure there are clear spaces between chord symbols in the `Text` field.

## 🛠 Roadmap

- [ ] Metronome enhancements (save local state for each song).
- [ ] Implementation of advanced filtering and searching by the `GroupBy` field.
- [ ] Multi-select support for groups (assigning a song to multiple sets/locations).
- [ ] Integration of a separate "Groups" table for better setlist management.
- [ ] Enhancing the chord parser to allow one-click transposition.

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
