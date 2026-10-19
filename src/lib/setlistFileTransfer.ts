import type { Setlist, SetlistSongEntry } from '@/lib/localSetlists';
import type { MetronomePreset } from '@/lib/metronomePresets';

interface SetlistFileData {
  version: 1;
  name: string;
  songs: SetlistSongEntry[];
}

/** Optional per-song data bundled alongside the setlists — same field names/shapes Settings → Backup uses, so either side can read the other's file. */
export interface SetlistBundleExtras {
  lineNotes?: Record<string, Record<string, string>>;
  tonalityPrefs?: Record<string, string>;
  metronomePresets?: Record<string, MetronomePreset>;
}

interface SetlistsBundleFileData extends SetlistBundleExtras {
  version: 2;
  exportedAt: string;
  setlists: { name: string; songs: SetlistSongEntry[] }[];
}

/**
 * Just the name + song list (names and their order), never lyrics/chords —
 * songs are matched by name against whatever sheet the importer has loaded,
 * same as every other locally-stored reference to a song in this app.
 */
export function downloadSetlistAsFile(setlist: Setlist) {
  const data: SetlistFileData = {
    version: 1,
    name: setlist.name,
    songs: setlist.songs,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = setlist.name.replace(/[^a-z0-9-_ ]/gi, '').trim() || 'setlist';
  link.download = `${safeName}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Bundles several setlists into one download — same `setlists: [{name,
 * songs}]` shape Settings → Backup already uses for its "Setlists" category,
 * so a file exported from here also imports cleanly through that flow.
 * `extras` is already scoped by the caller to just the songs in `setlists`.
 */
export function downloadSetlistsAsFile(setlists: Setlist[], extras: SetlistBundleExtras = {}) {
  const data: SetlistsBundleFileData = {
    version: 2,
    exportedAt: new Date().toISOString(),
    setlists: setlists.map(setlist => ({ name: setlist.name, songs: setlist.songs })),
    ...extras,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `setlists-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function parseSetlistEntry(
  raw: Record<string, unknown>
): { name: string; songs: SetlistSongEntry[] } | null {
  if (typeof raw.name !== 'string' || !raw.name.trim()) return null;
  if (!Array.isArray(raw.songs)) return null;

  const songs: SetlistSongEntry[] = (raw.songs as unknown[])
    .filter(
      (entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null
    )
    .filter(entry => typeof entry.songName === 'string')
    .map(entry => ({
      songName: entry.songName as string,
      ...(typeof entry.customIndex === 'number' ? { customIndex: entry.customIndex } : {}),
    }));

  return { name: raw.name.trim(), songs };
}

export interface ParsedSetlistsFile extends SetlistBundleExtras {
  setlists: { name: string; songs: SetlistSongEntry[] }[];
}

/**
 * Reads either shape: a single-setlist file (the per-row "Share" download,
 * never carries extras) or a multi-setlist bundle (the bulk "Export"
 * download, which may). Always returns a `setlists` array plus whichever
 * extras fields were present, so callers don't need to care which shape
 * they got.
 */
export async function parseSetlistsFile(file: File): Promise<ParsedSetlistsFile> {
  const text = await file.text();
  // Parsed as fully untrusted data — nothing here is assumed to already
  // match either shape until each field is checked below.
  const parsed = JSON.parse(text) as Record<string, unknown>;

  if (Array.isArray(parsed.setlists)) {
    const entries = (parsed.setlists as unknown[])
      .filter(
        (entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null
      )
      .map(parseSetlistEntry)
      .filter((entry): entry is { name: string; songs: SetlistSongEntry[] } => entry !== null);
    if (entries.length === 0) throw new Error('no setlists found in file');
    return {
      setlists: entries,
      ...(parsed.lineNotes && typeof parsed.lineNotes === 'object'
        ? { lineNotes: parsed.lineNotes as Record<string, Record<string, string>> }
        : {}),
      ...(parsed.tonalityPrefs && typeof parsed.tonalityPrefs === 'object'
        ? { tonalityPrefs: parsed.tonalityPrefs as Record<string, string> }
        : {}),
      ...(parsed.metronomePresets && typeof parsed.metronomePresets === 'object'
        ? { metronomePresets: parsed.metronomePresets as Record<string, MetronomePreset> }
        : {}),
    };
  }

  const single = parseSetlistEntry(parsed);
  if (!single) throw new Error('missing setlist name');
  return { setlists: [single] };
}
