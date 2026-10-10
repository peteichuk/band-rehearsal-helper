export interface Song {
  Name: string;
  /** Sheet-side default pin state — seeds the local pin, but the user can override it locally. */
  PinedByDefault?: boolean;
  Language?: string;
  Tonality?: string;
  BPM?: number;
  Text?: string;
  Holychords?: string;
  YouTube?: string;
  Chordify?: string;
  GroupBy?: string;
  SortingPriority?: number;
  /**
   * 1-based row number in the source sheet (header is row 1, so the first
   * song is row 2). Needed to target the right row when editing via the
   * Sheets API. Not part of the sheet data itself.
   */
  _rowIndex: number;
}

export interface SheetData {
  songs: Song[];
  /** Column headers in the exact order they appear in the sheet (for writes). */
  headers: string[];
}
