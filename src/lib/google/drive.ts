/** Whether the signed-in user (by the access token's identity) can edit this Drive file. */
export async function checkCanEdit(fileId: string, accessToken: string): Promise<boolean> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=capabilities(canEdit)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const body = await res.text();
    console.error(`[checkCanEdit] Drive API request failed (${res.status}):`, body);
    return false;
  }
  const data = (await res.json()) as { capabilities?: { canEdit?: boolean } };
  console.log('[checkCanEdit] capabilities:', data.capabilities);
  return Boolean(data.capabilities?.canEdit);
}
