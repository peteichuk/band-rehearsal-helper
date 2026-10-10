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
