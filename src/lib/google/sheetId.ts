// Accepts either a bare Spreadsheet ID or a full Google Sheets URL
// (e.g. https://docs.google.com/spreadsheets/d/<ID>/edit#gid=0) and
// returns just the ID, so pasting a URL into the "ID or URL" input works.
export function extractSheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : trimmed;
}
