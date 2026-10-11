import { Fragment } from 'react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import YoutubeIcon from '@/assets/icons/youtube.svg?react';
import HolychordsIcon from '@/assets/icons/holychords.svg?react';
import ChordifyIcon from '@/assets/icons/chordify.svg?react';
import type { Song } from '@/types/song';

interface SongLinksProps {
  song: Song;
}

export function hasSongLinks(song: Song): boolean {
  return Boolean(song.YouTube || song.Holychords || song.Chordify);
}

/** Renders the resource links as overflow-menu items (no wrapper — caller owns layout/separators). */
export function SongLinks({ song }: SongLinksProps) {
  return (
    <Fragment>
      {song.YouTube && (
        <DropdownMenuItem asChild>
          <a href={song.YouTube} target="_blank" rel="noopener noreferrer">
            <YoutubeIcon className="w-4 h-4" />
            Watch on YouTube
          </a>
        </DropdownMenuItem>
      )}

      {song.Holychords && (
        <DropdownMenuItem asChild>
          <a href={song.Holychords} target="_blank" rel="noopener noreferrer">
            <HolychordsIcon className="w-4 h-4" />
            View on HolyChords
          </a>
        </DropdownMenuItem>
      )}

      {song.Chordify && (
        <DropdownMenuItem asChild>
          <a href={song.Chordify} target="_blank" rel="noopener noreferrer">
            <ChordifyIcon className="w-4 h-4" />
            View on Chordify
          </a>
        </DropdownMenuItem>
      )}
    </Fragment>
  );
}
