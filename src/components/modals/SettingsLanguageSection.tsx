import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { setLocale, useAppPreferences, type LocalePreference } from '@/lib/appPreferences';
import { LOCALE_OPTIONS, resolveEffectiveLocale, type LocaleOption } from '@/lib/locale';
import { useIsLocaleLoading } from '@/hooks/useLocale';

/** `{flag} {label} ({CODE})` — the code stays uppercase as-is, just de-emphasized (smaller, muted) rather than lowercased. */
function LocaleLabel({ option }: { option: LocaleOption }) {
  return (
    <span className="flex items-center gap-1">
      <span>
        {option.flag} {option.label}
      </span>
      <span className="text-xs text-muted-foreground">({option.code})</span>
    </span>
  );
}

/** Compact language picker — a row inside the burger menu (Header), right above Settings. 'auto' (the default) follows the browser/OS language (see useLocale.ts), same pattern as ThemeSelect's 'auto'. */
export function SettingsLanguageSection() {
  const { t } = useTranslation();
  const { locale } = useAppPreferences();
  const isLoading = useIsLocaleLoading();

  // The trigger stays compact ("🇺🇦 UK") even for 'auto' — it shows
  // whichever language that currently resolves to, not the literal word
  // "Auto"; the dropdown's own "Auto (system)" item is where that's spelled out.
  const effectiveOption = LOCALE_OPTIONS.find(o => o.value === resolveEffectiveLocale(locale));
  const triggerLabel = effectiveOption ? (
    <span className="flex items-center gap-1">
      <span>{effectiveOption.flag}</span>
      <span>{effectiveOption.code}</span>
    </span>
  ) : (
    locale
  );

  return (
    <Select
      value={locale}
      onValueChange={value => setLocale(value as LocalePreference)}
      disabled={isLoading}
    >
      <SelectTrigger
        size="sm"
        className="w-auto max-w-[150px] gap-1 border-0 bg-transparent font-normal hover:bg-transparent focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent"
      >
        {isLoading ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {triggerLabel}
          </span>
        ) : (
          <SelectValue>{triggerLabel}</SelectValue>
        )}
      </SelectTrigger>
      <SelectContent position="popper" align="end" sideOffset={4}>
        <SelectItem value="auto">{t('Auto (system)')}</SelectItem>
        {LOCALE_OPTIONS.map(option => (
          <SelectItem key={option.value} value={option.value}>
            <LocaleLabel option={option} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
