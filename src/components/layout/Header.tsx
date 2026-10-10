import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, LogOut, Plus, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableIdPrompt } from '@/components/song-list/TableIdPrompt';
import { Button } from '@/components/ui/button';
import ReloadIcon from '@/assets/icons/refresh.svg?react';
import PrintIcon from '@/assets/icons/print.svg?react';
import ShareIcon from '@/assets/icons/share.svg?react';
import FaviconWhite from '@/assets/favicon-white.svg?react';
import type { PageActions } from '@/types/pageActions';
import type { GoogleAuthState } from '@/hooks/useGoogleAuth';

const BUTTON_CLASS =
  'h-9 px-3 flex items-center justify-center gap-2 rounded font-medium transition-colors shrink-0';
const PRIMARY_BUTTON_CLASS = cn(
  BUTTON_CLASS,
  'bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700'
);

interface HeaderProps {
  pageActions: PageActions;
  tableId: string | null;
  onTableIdChange: (tableId: string) => void;
  onOpenMetronome: () => void;
  onOpenShare: () => void;
  onOpenSettings: () => void;
  auth: GoogleAuthState;
  canEdit: boolean;
  onAddSong: () => void;
}

export function Header({
  pageActions,
  tableId,
  onTableIdChange,
  onOpenMetronome,
  onOpenShare,
  onOpenSettings,
  auth,
  canEdit,
  onAddSong,
}: HeaderProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  return (
    <header className="print:hidden bg-blue-600 dark:bg-blue-800 text-white px-2 py-2 shadow-lg">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {pageActions.showBack && (
            <button
              type="button"
              className={PRIMARY_BUTTON_CLASS}
              onClick={() => navigate(`/?${searchParams.toString()}`)}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-9 h-9 shrink-0">
            <FaviconWhite className="w-full h-full" />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!pageActions.showBack && (
            <div className="hidden md:block">
              <TableIdPrompt initialValue={tableId ?? ''} onLoad={onTableIdChange} />
            </div>
          )}

          {canEdit && (
            <Button type="button" className="h-9" onClick={onAddSong}>
              <Plus className="w-4 h-4" />
              Add Song
            </Button>
          )}

          <button
            type="button"
            className={PRIMARY_BUTTON_CLASS}
            onClick={() => window.location.reload()}
          >
            <ReloadIcon className="w-4 h-4" />
          </button>

          {pageActions.showPrint && (
            <button type="button" className={PRIMARY_BUTTON_CLASS} onClick={() => window.print()}>
              <PrintIcon className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            title="Open / Close Metronome"
            className={cn(BUTTON_CLASS, 'bg-orange-600 hover:bg-orange-700')}
            onClick={onOpenMetronome}
          >
            <span className="text-sm font-semibold">Metronome</span>
          </button>

          <button type="button" className={PRIMARY_BUTTON_CLASS} onClick={onOpenShare}>
            <ShareIcon className="w-4 h-4" />
          </button>

          {!pageActions.showBack && (
            <button
              type="button"
              title="Settings"
              className={PRIMARY_BUTTON_CLASS}
              onClick={onOpenSettings}
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {!pageActions.showBack &&
            (auth.isSignedIn ? (
              <button
                type="button"
                title={`Signed in as ${auth.email ?? ''} — click to sign out`}
                className={PRIMARY_BUTTON_CLASS}
                onClick={auth.signOut}
              >
                <span className="hidden sm:inline text-xs max-w-24 truncate">{auth.email}</span>
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                className={PRIMARY_BUTTON_CLASS}
                disabled={!auth.isReady}
                title={auth.isReady ? 'Sign in with Google' : 'Google sign-in is not configured'}
                onClick={auth.signIn}
              >
                Sign in
              </button>
            ))}
        </div>
      </div>
    </header>
  );
}
