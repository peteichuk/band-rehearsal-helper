import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, LogIn, LogOut, Menu, Plus, Settings } from 'lucide-react';
import { TableIdPrompt } from '@/components/song-list/TableIdPrompt';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PRIMARY_BUTTON_CLASS } from '@/components/layout/headerButtonStyles';
import ReloadIcon from '@/assets/icons/refresh.svg?react';
import ShareIcon from '@/assets/icons/share.svg?react';
import FaviconWhite from '@/assets/favicon-white.svg?react';
import type { PageActions } from '@/types/pageActions';
import type { GoogleAuthState } from '@/hooks/useGoogleAuth';

interface HeaderProps {
  pageActions: PageActions;
  tableId: string | null;
  onTableIdChange: (tableId: string) => void;
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
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center gap-2">
          {pageActions.showBack && (
            <button
              type="button"
              className={PRIMARY_BUTTON_CLASS}
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete('tonality');
                navigate(`/?${next.toString()}`);
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-9 h-9 shrink-0">
            <FaviconWhite className="w-full h-full" />
          </div>
        </div>

        <button
          type="button"
          className={PRIMARY_BUTTON_CLASS}
          onClick={() => window.location.reload()}
        >
          <ReloadIcon className="w-4 h-4" />
        </button>

        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" title="Menu" className={PRIMARY_BUTTON_CLASS}>
                <Menu className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {canEdit && (
                <DropdownMenuItem onSelect={onAddSong}>
                  <Plus className="w-4 h-4" />
                  Add Song
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onSelect={onOpenShare}>
                <ShareIcon className="w-4 h-4" />
                Share
              </DropdownMenuItem>

              {!pageActions.showBack && (
                <>
                  <DropdownMenuSeparator />
                  <div
                    className="px-1.5 py-1"
                    onKeyDown={event => event.stopPropagation()}
                    onPointerDown={event => event.stopPropagation()}
                  >
                    <TableIdPrompt initialValue={tableId ?? ''} onLoad={onTableIdChange} />
                  </div>
                </>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem onSelect={onOpenSettings}>
                <Settings className="w-4 h-4" />
                Settings
              </DropdownMenuItem>

              {auth.isSignedIn ? (
                <DropdownMenuItem onSelect={auth.signOut}>
                  <LogOut className="w-4 h-4" />
                  <span className="truncate">Sign out{auth.email ? ` (${auth.email})` : ''}</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  disabled={!auth.isReady}
                  onSelect={auth.signIn}
                  title={auth.isReady ? undefined : 'Google sign-in is not configured'}
                >
                  <LogIn className="w-4 h-4" />
                  Sign in
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
