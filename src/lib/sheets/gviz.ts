import type { SheetData, Song } from '@/types/song';

interface GvizCell {
  v: unknown;
}

interface GvizColumn {
  label: string;
}

interface GvizTable {
  cols: GvizColumn[];
  rows: { c: (GvizCell | null)[] }[];
}

interface GvizResponse {
  table: GvizTable;
}

export function parseGvizResponse(text: string): GvizResponse {
  const jsonText = text
    .replace(/^[^(]*\(/, '') // remove everything before (
    .replace(/\);?$/, ''); // remove ); at the end
  return JSON.parse(jsonText) as GvizResponse;
}

export function normalizeRows(table: GvizTable): SheetData {
  const headers = table.cols.map(c => c.label).filter(label => label);

  const songs = table.rows.map((row, index) => {
    const obj: Record<string, unknown> = {};
    row.c.forEach((cell, i) => {
      // Unlike the legacy app, keep falsy-but-present values (BPM: 0, Favorites: false, "")
      // instead of silently dropping the key.
      if (cell?.v != null) {
        obj[headers[i]] = cell.v;
      }
    });
    // Header occupies row 1, so the first data row is row 2.
    obj._rowIndex = index + 2;
    return obj as unknown as Song;
  });

  return { songs, headers };
}

export async function fetchSongs(sheetsId: string): Promise<SheetData> {
  const urlToFetch =
    `https://docs.google.com/spreadsheets/d/${sheetsId}/gviz/tq` +
    `?tqx=out:json&headers=1&tq=${encodeURIComponent('select *')}`;

  const response = await fetch(urlToFetch, { mode: 'cors' });
  if (!response.ok) throw new Error('Network response was not ok');

  const text = await response.text();
  const data = parseGvizResponse(text);
  return normalizeRows(data.table);
}
