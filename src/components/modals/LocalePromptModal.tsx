import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { setLocale, setLocalePromptSeen } from '@/lib/appPreferences';
import { LOCALE_OPTIONS, resolveSystemLocale, type Locale } from '@/lib/locale';

interface LocalePromptModalProps {
  open: boolean;
}

/**
 * Shown once, and only when the system language is an ambiguous ru/be guess
 * rather than a direct match (gated in App.tsx by `localePromptSeen` AND
 * `isAmbiguousSystemLocale()` — a system language of uk/en/pl needs no
 * confirmation, so this never appears for those). The recommended option
 * (resolveSystemLocale(), same logic 'auto' uses day to day — 'uk' whenever
 * this modal shows) is just visually emphasized, never auto-dismissed, since
 * the user might still want a different language. No close button/outside
 * click: picking a language is how this dialog closes.
 */
export function LocalePromptModal({ open }: LocalePromptModalProps) {
  const recommended: Locale = resolveSystemLocale();

  const choose = (value: Locale) => {
    setLocale(value);
    setLocalePromptSeen(true);
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-xs"
        showCloseButton={false}
        onInteractOutside={event => event.preventDefault()}
        onEscapeKeyDown={event => event.preventDefault()}
      >
        <DialogTitle>Choose your language / Оберіть мову / Wybierz język</DialogTitle>
        <div className="flex flex-col gap-2">
          {LOCALE_OPTIONS.map(option => (
            <Button
              key={option.value}
              type="button"
              variant={option.value === recommended ? 'default' : 'outline'}
              className="justify-start gap-2"
              onClick={() => choose(option.value)}
            >
              <span>{option.flag}</span>
              <span>{option.label}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
