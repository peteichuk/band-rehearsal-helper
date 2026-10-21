import { getLocalFavorites, setLocalFavorites } from '@/lib/localFavorites';
import { deletePinOverride, getPinOverrides, setPinOverrides } from '@/lib/localPins';
import { addSongGroup, deleteSongGroups, getAllLocalGroups } from '@/lib/localGroups';
import {
  deleteSongTonalityPref,
  getAllSongTonalityPrefs,
  mergeSongTonalityPrefs,
} from '@/lib/songKeyPrefs';
import {
  deleteSongLineNotes,
  getSongLineNotesSnapshot,
  mergeSongLineNotes,
} from '@/lib/songLineNotes';
import {
  deleteMetronomePreset,
  getMetronomePresetsSnapshot,
  mergeMetronomePresets,
} from '@/lib/metronomePresets';
import type { ExportedSettings } from '@/lib/settingsBackupFormat';

export type ImportConflictChoice = 'cancel' | 'merge' | 'replace';

/** True if there's anything locally saved for this song worth exporting. */
export function hasSongSettings(songName: string): boolean {
  return Boolean(
    getPinOverrides()[songName] !== undefined ||
    getAllLocalGroups()[songName]?.length ||
    getAllSongTonalityPrefs()[songName] ||
    getSongLineNotesSnapshot()[songName] ||
    getMetronomePresetsSnapshot()[songName] ||
    getLocalFavorites().includes(songName)
  );
}

/**
 * Exports just this one song's own local data (pin override, tags,
 * tonality/capo, line notes, metronome preset, favorite status) — same
 * `ExportedSettings` shape Settings → Backup uses, just with every per-song
 * field filtered down to this one key, so the file drops straight into
 * Backup's own Import too.
 */
export function downloadSongSettingsAsFile(songName: string) {
  const pinOverride = getPinOverrides()[songName];
  const groups = getAllLocalGroups()[songName];
  const tonalityPref = getAllSongTonalityPrefs()[songName];
  const lineNotes = getSongLineNotesSnapshot()[songName];
  const metronomePreset = getMetronomePresetsSnapshot()[songName];
  const isFavorite = getLocalFavorites().includes(songName);

  const data: ExportedSettings = {
    version: 2,
    exportedAt: new Date().toISOString(),
    ...(isFavorite && { favorites: [songName] }),
    ...(pinOverride !== undefined && { pinOverrides: { [songName]: pinOverride } }),
    ...(groups?.length && { customGroups: { [songName]: groups } }),
    ...(tonalityPref && { tonalityPrefs: { [songName]: tonalityPref } }),
    ...(lineNotes && { lineNotes: { [songName]: lineNotes } }),
    ...(metronomePreset && { metronomePresets: { [songName]: metronomePreset } }),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = songName.replace(/[^a-z0-9-_ ]/gi, '').trim() || 'song';
  link.download = `${safeName}-settings.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function applyFavorite(songName: string, isFavoriteInFile: boolean) {
  const current = getLocalFavorites();
  const isFavoriteNow = current.includes(songName);
  if (isFavoriteInFile === isFavoriteNow) return false;
  setLocalFavorites(
    isFavoriteInFile ? [...current, songName] : current.filter(name => name !== songName)
  );
  return true;
}

export async function parseSongSettingsFile(file: File): Promise<Partial<ExportedSettings>> {
  const text = await file.text();
  return JSON.parse(text) as Partial<ExportedSettings>;
}

/**
 * True if the parsed file has any data at all for this specific song —
 * checked *before* doing anything else with the file. A per-song Import is
 * scoped to exactly one song (unlike the Setlists/Settings → Backup
 * imports, which apply to everything in the file): a file that happens to
 * be a different song's export, or a bulk backup that doesn't happen to
 * mention this song, must never touch this song's local data at all — not
 * even Replace's "clear everything first", which previously ran
 * unconditionally and could wipe a song's local settings for nothing.
 */
export function songHasDataInFile(parsed: Partial<ExportedSettings>, songName: string): boolean {
  return Boolean(
    parsed.favorites?.includes(songName) ||
    parsed.pinOverrides?.[songName] !== undefined ||
    parsed.customGroups?.[songName]?.length ||
    parsed.tonalityPrefs?.[songName] ||
    parsed.lineNotes?.[songName] ||
    parsed.metronomePresets?.[songName]
  );
}

/**
 * Applies an already-parsed settings file to just this one song — accepts
 * either a per-song export from here, or a full bulk Settings → Backup file
 * (only `songName`'s own entry is ever pulled out of it, every other song
 * in the file is ignored). Returns a human-readable list of what was
 * imported, or an empty list if the file had nothing for this song.
 *
 * Callers should check `songHasDataInFile` first and skip calling this
 * entirely when it's false — there's nothing to merge OR replace, and
 * `mode: 'replace'` would otherwise clear this song's local settings for
 * absolutely nothing.
 *
 * `mode: 'merge'` keeps whatever's already saved for this song and layers
 * the file's values on top, winning only where both sides have the same
 * field (pin override, tonality, a given line note, a given metronome
 * preset field) and simply adding on top where only the file has it (tags).
 * `mode: 'replace'` discards this song's current local settings entirely
 * first, for every category — including ones the file doesn't mention —
 * then applies only what the file has.
 */
export function applySongSettings(
  songName: string,
  parsed: Partial<ExportedSettings>,
  mode: 'merge' | 'replace' = 'merge'
): string[] {
  const imported: string[] = [];

  const isFavoriteInFile = Boolean(parsed.favorites?.includes(songName));
  if (mode === 'replace' || isFavoriteInFile) {
    if (applyFavorite(songName, isFavoriteInFile)) imported.push('favorite status');
  }

  const pinOverride = parsed.pinOverrides?.[songName];
  if (pinOverride !== undefined) {
    setPinOverrides({ ...getPinOverrides(), [songName]: pinOverride });
    imported.push('pin override');
  } else if (mode === 'replace') {
    deletePinOverride(songName);
  }

  const groups = parsed.customGroups?.[songName];
  if (mode === 'replace') deleteSongGroups(songName);
  if (groups?.length) {
    groups.forEach(label => addSongGroup(songName, label));
    imported.push('tags');
  }

  const tonalityPref = parsed.tonalityPrefs?.[songName];
  if (tonalityPref) {
    mergeSongTonalityPrefs({ [songName]: tonalityPref });
    imported.push('tonality/capo choice');
  } else if (mode === 'replace') {
    deleteSongTonalityPref(songName);
  }

  const lineNotes = parsed.lineNotes?.[songName];
  if (mode === 'replace') deleteSongLineNotes(songName);
  if (lineNotes) {
    mergeSongLineNotes({ [songName]: lineNotes });
    imported.push('line notes');
  }

  const metronomePreset = parsed.metronomePresets?.[songName];
  if (mode === 'replace') deleteMetronomePreset(songName);
  if (metronomePreset) {
    mergeMetronomePresets({ [songName]: metronomePreset });
    imported.push('metronome preset');
  }

  return imported;
}
