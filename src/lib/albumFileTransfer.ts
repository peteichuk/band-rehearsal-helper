import type { Album, AlbumSongEntry } from '@/lib/localAlbums';

interface AlbumFileData {
  version: 1;
  name: string;
  songs: AlbumSongEntry[];
}

/**
 * Just the name + song list (names and their order), never lyrics/chords —
 * songs are matched by name against whatever sheet the importer has loaded,
 * same as every other locally-stored reference to a song in this app.
 */
export function downloadAlbumAsFile(album: Album) {
  const data: AlbumFileData = {
    version: 1,
    name: album.name,
    songs: album.songs,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = album.name.replace(/[^a-z0-9-_ ]/gi, '').trim() || 'album';
  link.download = `${safeName}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function parseAlbumFile(
  file: File
): Promise<{ name: string; songs: AlbumSongEntry[] }> {
  const text = await file.text();
  // Parsed as fully untrusted data — nothing here is assumed to already
  // match AlbumFileData's shape until each field is checked below.
  const parsed = JSON.parse(text) as Record<string, unknown>;

  if (typeof parsed.name !== 'string' || !parsed.name.trim()) {
    throw new Error('missing album name');
  }
  if (!Array.isArray(parsed.songs)) {
    throw new Error('missing song list');
  }

  const songs: AlbumSongEntry[] = (parsed.songs as unknown[])
    .filter(
      (entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null
    )
    .filter(entry => typeof entry.songName === 'string')
    .map(entry => ({
      songName: entry.songName as string,
      ...(typeof entry.customIndex === 'number' ? { customIndex: entry.customIndex } : {}),
    }));

  return { name: parsed.name.trim(), songs };
}
