// Not a secret: OAuth Client IDs for browser (SPA) apps are meant to be public.
// Security comes from the "Authorized JavaScript origins" allowlist configured
// for this client in Google Cloud Console, not from hiding this value.
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');
