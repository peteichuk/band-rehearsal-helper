/** Reads the first tab's name — the one gviz reads from by default, so writes target the same tab. */
export async function getFirstSheetTitle(tableId: string, accessToken: string): Promise<string> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${tableId}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error('Could not read sheet metadata');
  const data = (await res.json()) as { sheets?: { properties?: { title?: string } }[] };
  const title = data.sheets?.[0]?.properties?.title;
  if (!title) throw new Error('Sheet has no tabs');
  return title;
}

function columnLetter(zeroBasedIndex: number): string {
  let n = zeroBasedIndex + 1;
  let letters = '';
  while (n > 0) {
    const remainder = (n - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function rowValues(song: Record<string, unknown>, headers: string[]): unknown[] {
  return headers.map(header => song[header] ?? '');
}

async function assertOk(res: Response): Promise<void> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets API error (${res.status}): ${body}`);
  }
}

export async function appendSong(
  tableId: string,
  accessToken: string,
  sheetTitle: string,
  headers: string[],
  song: Record<string, unknown>
): Promise<void> {
  const range = `${sheetTitle}!A:${columnLetter(headers.length - 1)}`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${tableId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [rowValues(song, headers)] }),
    }
  );
  await assertOk(res);
}

export async function updateSong(
  tableId: string,
  accessToken: string,
  sheetTitle: string,
  headers: string[],
  rowIndex: number,
  song: Record<string, unknown>
): Promise<void> {
  const range = `${sheetTitle}!A${rowIndex}:${columnLetter(headers.length - 1)}${rowIndex}`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${tableId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [rowValues(song, headers)] }),
    }
  );
  await assertOk(res);
}
