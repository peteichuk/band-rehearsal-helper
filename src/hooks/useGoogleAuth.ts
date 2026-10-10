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

export function useGoogleAuth(): GoogleAuthState {
  const [isReady, setIsReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tokenClientRef = useRef<ReturnType<
    NonNullable<Window['google']>['accounts']['oauth2']['initTokenClient']
  > | null>(null);

  // Restore a still-valid session immediately (survives a page reload within
  // the ~1h token lifetime — GIS keeps the token in memory only by default).
  useEffect(() => {
    const restored = loadAuthSession();
    if (restored) {
      setAccessToken(restored.accessToken);
      setEmail(restored.email);
    }
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
                  expiresAt: Date.now() + response.expires_in * 1000,
                });
              })
              .catch(() => {
                setEmail(null);
                saveAuthSession({
                  accessToken: response.access_token,
                  email: null,
                  expiresAt: Date.now() + response.expires_in * 1000,
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
  }, []);

  const signIn = useCallback(() => {
    tokenClientRef.current?.requestAccessToken();
  }, []);

  const signOut = useCallback(() => {
    if (accessToken && window.google) {
      window.google.accounts.oauth2.revoke(accessToken);
    }
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
