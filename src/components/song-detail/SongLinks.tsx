import { Fragment } from 'react';
import YoutubeIcon from '@/assets/icons/youtube.svg?react';
import HolychordsIcon from '@/assets/icons/holychords.svg?react';
import ChordifyIcon from '@/assets/icons/chordify.svg?react';
import type { Song } from '@/types/song';

interface SongLinksProps {
  song: Song;
}

/**
 * Renders just the resource link buttons (no wrapper) so the caller can lay
 * them out in the same flex row as the rest of the song toolbar, matching
 * the legacy app where links and toolbar controls flowed as one line.
 */
export function SongLinks({ song }: SongLinksProps) {
  return (
    <Fragment>
      {song.YouTube && (
        <a
          href={song.YouTube}
          target="_blank"
          rel="noopener noreferrer"
          title="Watch on YouTube"
          className="h-9 px-2 shrink-0 bg-red-600 dark:bg-red-800 hover:bg-red-700 dark:hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <YoutubeIcon className="w-5 h-5" />
        </a>
      )}

      {song.Holychords && (
        <a
          href={song.Holychords}
          target="_blank"
          rel="noopener noreferrer"
          title="View on HolyChords"
          className="h-9 px-2 shrink-0 bg-[#26ad92] hover:bg-[#50bf5a] text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <HolychordsIcon className="w-5 h-5" />
        </a>
      )}

      {song.Chordify && (
        <a
          href={song.Chordify}
          target="_blank"
          rel="noopener noreferrer"
          title="View on Chordify"
          className="h-9 px-2 shrink-0 bg-[#0A8282] hover:bg-[#10bbbb] text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <ChordifyIcon className="w-5 h-5" />
        </a>
      )}
    </Fragment>
  );
}
