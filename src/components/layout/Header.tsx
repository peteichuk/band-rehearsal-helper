import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Info, LogIn, LogOut, Plus, Settings } from 'lucide-react';
import { TableIdPrompt } from '@/components/song-list/TableIdPrompt';
import { ThemeSelect } from '@/components/layout/ThemeSelect';
import { MetronomeIcon } from '@/components/metronome/MetronomeIcon';
import { useMenuOpen, useSetMenuOpen } from '@/contexts/MenuContext';
import { extractSheetId } from '@/lib/google/sheetId';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  METRONOME_BUTTON_CLASS,
  PRIMARY_BUTTON_CLASS,
} from '@/components/layout/headerButtonStyles';
import ReloadIcon from '@/assets/icons/refresh.svg?react';
import ShareIcon from '@/assets/icons/share.svg?react';
import FaviconWhite from '@/assets/favicon-white.svg?react';
import { cn } from '@/lib/utils';
import type { PageActions } from '@/types/pageActions';
import type { GoogleAuthState } from '@/hooks/useGoogleAuth';

const MENU_ITEM_CLASS =
  'flex items-center gap-3 w-full rounded-lg px-3 py-3 text-base font-medium text-left hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none';

/**
 * Hamburger icon that morphs into an X as `open` toggles. Always a 20px
 * glyph — this app's one standard icon size (it's what matches text-sm's own
 * line-height, so an icon-only button ends up the same height as a text
 * button; see button.tsx's sizing-formula comment) — so both the header
 * trigger and the sheet's own close button stay consistent with every other
 * icon in the app; only their surrounding padding differs.
 */
function MenuToggleIcon({ open }: { open: boolean }) {
  return (
    <span className="relative flex h-5 w-5 items-center justify-center">
      <span
        className={cn(
          'absolute block h-0.5 w-5 rounded-full bg-current transition-transform duration-200',
          open ? 'translate-y-0 rotate-45' : '-translate-y-[6px]'
        )}
      />
      <span
        className={cn(
          'absolute block h-0.5 w-5 rounded-full bg-current transition-opacity duration-150',
          open && 'opacity-0'
        )}
      />
      <span
        className={cn(
          'absolute block h-0.5 w-5 rounded-full bg-current transition-transform duration-200',
          open ? 'translate-y-0 -rotate-45' : 'translate-y-[6px]'
        )}
      />
    </span>
  );
}

interface HeaderProps {
  pageActions: PageActions;
  tableId: string | null;
  onTableIdChange: (tableId: string) => void;
  onOpenShare: () => void;
  onOpenSettings: () => void;
  onOpenMetronome: () => void;
  isMetronomePlaying: boolean;
  /** Whether `useSongsQuery` currently has a request in flight for `tableId`. */
  isTableFetching: boolean;
  /**
   * Whether `useSongsQuery` has resolved successfully for `tableId` — not
   * just "not fetching", since a brand-new `tableId` reads `isFetching:
   * false` for one render before the fetch actually dispatches (it's kicked
   * off from an effect, a tick after the `tableId` prop itself updates).
   * `isSuccess` only flips once there's really data for it (or instantly, if
   * it was already cached).
   */
  isTableLoaded: boolean;
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
  onOpenMetronome,
  isMetronomePlaying,
  isTableFetching,
  isTableLoaded,
  auth,
  canEdit,
  onAddSong,
}: HeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const menuOpen = useMenuOpen();
  const setMenuOpen = useSetMenuOpen();

  // Closes the menu once the table submitted from it has actually loaded:
  // the `tableId` prop has caught up to what was typed, *and* the query for
  // it has resolved (`isSuccess`), not merely "stopped fetching" (see the
  // prop doc comment for why that distinction matters).
  const [pendingTableId, setPendingTableId] = useState<string | null>(null);
  useEffect(() => {
    if (pendingTableId && tableId === pendingTableId && isTableLoaded) {
      setMenuOpen(false);
      setPendingTableId(null);
    }
  }, [pendingTableId, tableId, isTableLoaded, setMenuOpen]);

  return (
    <header className="print:hidden bg-blue-600 dark:bg-blue-800 text-white px-2 py-2 shadow-lg">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center gap-2">
          {pageActions.showBack && (
            <button
              type="button"
              className={PRIMARY_BUTTON_CLASS}
              onClick={() => {
                if (pageActions.backTo) {
                  navigate(pageActions.backTo);
                  return;
                }
                const next = new URLSearchParams(searchParams);
                next.delete('tonality');
                navigate(`/?${next.toString()}`);
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 shrink-0">
            <FaviconWhite className="w-full h-full" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={PRIMARY_BUTTON_CLASS}
            onClick={() => window.location.reload()}
          >
            <ReloadIcon className="w-5 h-5" />
          </button>

          <button
            type="button"
            title={t('Metronome')}
            data-metronome-trigger
            className={METRONOME_BUTTON_CLASS}
            onClick={onOpenMetronome}
          >
            <MetronomeIcon playing={isMetronomePlaying} className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2">
          <ThemeSelect />
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button type="button" title={t('Menu')} className={PRIMARY_BUTTON_CLASS}>
                <MenuToggleIcon open={menuOpen} />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 p-0"
              // Radix returns focus to the trigger (the hamburger button) on
              // close by default. If the sheet was closed by pressing Enter
              // in the TableIdPrompt input, that same keypress's keyup lands
              // on the now-focused trigger button and re-activates it as a
              // native button click — reopening the sheet right after it
              // closed. Suppressing the auto-focus avoids that.
              onCloseAutoFocus={event => event.preventDefault()}
            >
              <SheetHeader className="justify-end">
                <SheetTitle className="sr-only">{t('Menu')}</SheetTitle>
                <SheetClose asChild>
                  <button
                    type="button"
                    title={t('Close')}
                    className="flex p-1.5 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <MenuToggleIcon open />
                  </button>
                </SheetClose>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
                {canEdit && (
                  <SheetClose asChild>
                    <button type="button" className={MENU_ITEM_CLASS} onClick={onAddSong}>
                      <Plus className="w-4 h-4 shrink-0" />
                      {t('Add Song')}
                    </button>
                  </SheetClose>
                )}

                <SheetClose asChild>
                  <button type="button" className={MENU_ITEM_CLASS} onClick={onOpenShare}>
                    <ShareIcon className="w-4 h-4 shrink-0" />
                    {t('Share')}
                  </button>
                </SheetClose>

                <div className="my-2 border-t border-border" />
                <div className="px-1 py-1">
                  <TableIdPrompt
                    initialValue={tableId ?? ''}
                    onLoad={value => {
                      setPendingTableId(extractSheetId(value));
                      onTableIdChange(value);
                    }}
                    loading={isTableFetching}
                  />
                </div>

                <div className="my-2 border-t border-border" />

                <SheetClose asChild>
                  <button type="button" className={MENU_ITEM_CLASS} onClick={onOpenSettings}>
                    <Settings className="w-4 h-4 shrink-0" />
                    {t('Settings')}
                  </button>
                </SheetClose>

                <a href="landing.html" className={MENU_ITEM_CLASS}>
                  <Info className="w-4 h-4 shrink-0" />
                  {t('About')}
                </a>

                <div className="my-2 border-t border-border" />

                {auth.isSignedIn ? (
                  <SheetClose asChild>
                    <button type="button" className={MENU_ITEM_CLASS} onClick={auth.signOut}>
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {auth.email
                          ? t('Sign out ({{email}})', { email: auth.email })
                          : t('Sign out')}
                      </span>
                    </button>
                  </SheetClose>
                ) : (
                  <SheetClose asChild>
                    <button
                      type="button"
                      className={MENU_ITEM_CLASS}
                      disabled={!auth.isReady}
                      onClick={auth.signIn}
                      title={auth.isReady ? undefined : t('Google sign-in is not configured')}
                    >
                      <LogIn className="w-4 h-4 shrink-0" />
                      {t('Sign in')}
                    </button>
                  </SheetClose>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
