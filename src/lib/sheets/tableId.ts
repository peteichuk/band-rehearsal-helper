/**
 * Accepts either a raw Google Sheets document ID, or a full Sheets URL
 * (e.g. pasted from the browser address bar), and returns the bare ID.
 */
export function extractSheetId(input: string): string {
  const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : input;
}
