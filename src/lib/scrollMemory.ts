// Session-only (no persistence needed across reloads): remembers how far down
// the song list was scrolled, so returning from a song restores that spot
// instead of jumping back to the top.
//
// The app's layout doesn't actually confine scrolling to an inner container
// (the root wrapper uses min-h-screen, not h-screen, so it just grows taller
// than the viewport) — the real scroll happens on the window itself.
let listScrollTop = 0;

export function saveListScrollTop(value: number) {
  listScrollTop = value;
}

export function getListScrollTop(): number {
  return listScrollTop;
}

// Same idea, for the setlists list — kept separate from the song list's own
// memory above since they're independent scroll positions. Opening a setlist
// itself always starts at the top (not restored) — only coming back to this
// list remembers where it was.
let setlistsScrollTop = 0;

export function saveSetlistsScrollTop(value: number) {
  setlistsScrollTop = value;
}

export function getSetlistsScrollTop(): number {
  return setlistsScrollTop;
}

// Same idea again, for one setlist's own song list — remembers where it was
// scrolled to when a song is opened from it, so going back restores that
// spot. Opening the setlist itself (from the setlists list) always resets
// this to 0 first, so a leftover value from a *different* setlist's visit
// never leaks in — every fresh entry into a setlist starts at its own top.
let setlistSongsScrollTop = 0;

export function saveSetlistSongsScrollTop(value: number) {
  setlistSongsScrollTop = value;
}

export function getSetlistSongsScrollTop(): number {
  return setlistSongsScrollTop;
}
