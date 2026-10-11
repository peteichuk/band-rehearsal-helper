import { useCallback, useEffect, useRef, useState } from 'react';
import { loadGoogleIdentityServices } from '@/lib/google/gis';
import { GOOGLE_CLIENT_ID, GOOGLE_SCOPES } from '@/lib/google/config';
import { clearAuthSession, loadAuthSession, saveAuthSession } from '@/lib/google/authStorage';

export interface GoogleAuthState {
  /** false until the Client ID is configured and the GIS script has loaded. */
  isReady: boolean;
  isSignedIn: boolean;
  email: string | null;
  accessToken: string | null;
  signIn: () => void;
  signOut: () => void;
  error: string | null;
}

// Google caps this token-client flow's access token at ~1h no matter what we
// ask for — that ceiling can't be configured away. Refreshing silently
// this long before it expires keeps a session effectively going as long as
// the tab stays open and Google still trusts the browser, without ever
// showing the user a sign-in prompt mid-rehearsal.
const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000;

export function useGoogleAuth(): GoogleAuthState {
  const [isReady, setIsReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tokenClientRef = useRef<ReturnType<
    NonNullable<Window['google']>['accounts']['oauth2']['initTokenClient']
  > | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mobile browsers throttle (or fully suspend) setTimeout in a backgrounded
  // tab — e.g. the screen locking mid-rehearsal — so a scheduled refresh can
  // fire minutes late, after the token's already expired and a request has
  // already 401'd. Tracked so the visibilitychange handler below can catch
  // up immediately on resume instead of waiting for that overdue timer.
  const expiresAtRef = useRef<number | null>(null);

  const refreshNow = useCallback(() => {
    // Silent (prompt: '') — renews the token invisibly while the Google
    // session/consent is still valid; if it isn't, error_callback fires and
    // the user just signs in again like normal, no different from today.
    tokenClientRef.current?.requestAccessToken({ prompt: '' });
  }, []);

  const scheduleRefresh = useCallback(
    (expiresAt: number) => {
      expiresAtRef.current = expiresAt;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      const delay = Math.max(expiresAt - Date.now() - REFRESH_BEFORE_EXPIRY_MS, 0);
      refreshTimerRef.current = setTimeout(refreshNow, delay);
    },
    [refreshNow]
  );

  // Catches up the moment the tab is foregrounded again, in case the timer
  // above was due while backgrounded and got delayed past it.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const expiresAt = expiresAtRef.current;
      if (expiresAt == null) return;
      if (Date.now() >= expiresAt - REFRESH_BEFORE_EXPIRY_MS) refreshNow();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refreshNow]);

  // Restore a still-valid session immediately (survives a page/tab reload —
  // see authStorage, which now persists across browser restarts too) and
  // pick up the refresh schedule where it left off.
  useEffect(() => {
    const restored = loadAuthSession();
    if (restored) {
      setAccessToken(restored.accessToken);
      setEmail(restored.email);
      scheduleRefresh(restored.expiresAt);
    }
  }, [scheduleRefresh]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const clientId = GOOGLE_CLIENT_ID;
    if (!clientId) return;
    let cancelled = false;

    loadGoogleIdentityServices()
      .then(() => {
        if (cancelled || !window.google) return;

        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: GOOGLE_SCOPES,
          callback: response => {
            if (response.error) {
              setError(response.error_description || response.error);
              return;
            }
            setError(null);
            setAccessToken(response.access_token);
            const expiresAt = Date.now() + response.expires_in * 1000;
            scheduleRefresh(expiresAt);

            fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: { Authorization: `Bearer ${response.access_token}` },
            })
              .then(res => res.json())
              .then((info: { email?: string }) => {
                const resolvedEmail = info.email ?? null;
                setEmail(resolvedEmail);
                saveAuthSession({
                  accessToken: response.access_token,
                  email: resolvedEmail,
                  expiresAt,
                });
              })
              .catch(() => {
                setEmail(null);
                saveAuthSession({
                  accessToken: response.access_token,
                  email: null,
                  expiresAt,
                });
              });
          },
          error_callback: err => {
            setError(err.message ?? err.type);
          },
        });

        setIsReady(true);
      })
      .catch((err: Error) => setError(err.message));

    return () => {
      cancelled = true;
    };
  }, [scheduleRefresh]);

  const signIn = useCallback(() => {
    tokenClientRef.current?.requestAccessToken();
  }, []);

  const signOut = useCallback(() => {
    if (accessToken && window.google) {
      window.google.accounts.oauth2.revoke(accessToken);
    }
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    expiresAtRef.current = null;
    clearAuthSession();
    setAccessToken(null);
    setEmail(null);
  }, [accessToken]);

  return {
    isReady,
    isSignedIn: Boolean(accessToken),
    email,
    accessToken,
    signIn,
    signOut,
    error,
  };
}
