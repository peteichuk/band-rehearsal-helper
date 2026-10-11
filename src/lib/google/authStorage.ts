const STORAGE_KEY = 'googleAuthSession';

interface StoredSession {
  accessToken: string;
  email: string | null;
  expiresAt: number; // epoch ms
}

// localStorage, not sessionStorage — so closing the tab (or the whole
// browser) doesn't force a re-login as long as the underlying Google token
// is still being kept fresh (see useGoogleAuth's silent refresh).
export function saveAuthSession(session: StoredSession) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore (e.g. storage disabled)
  }
}

export function loadAuthSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as StoredSession;
    if (session.expiresAt <= Date.now()) {
      clearAuthSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
