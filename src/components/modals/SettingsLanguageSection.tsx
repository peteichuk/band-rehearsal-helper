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
import { LOCALE_OPTIONS, type LocaleOption } from '@/lib/locale';
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

/** App UI language — 'auto' (the default) follows the browser/OS language (see useLocale.ts), same pattern as ThemeSelect's 'auto'. */
export function SettingsLanguageSection() {
  const { t } = useTranslation();
  const { locale } = useAppPreferences();
  const isLoading = useIsLocaleLoading();

  const selectedOption = LOCALE_OPTIONS.find(o => o.value === locale);
  const triggerLabel =
    locale === 'auto' ? (
      t('Auto (system)')
    ) : selectedOption ? (
      <LocaleLabel option={selectedOption} />
    ) : (
      locale
    );

  return (
    <Select
      value={locale}
      onValueChange={value => setLocale(value as LocalePreference)}
      disabled={isLoading}
    >
      <SelectTrigger className="w-full">
        {isLoading ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {triggerLabel}
          </span>
        ) : (
          <SelectValue>{triggerLabel}</SelectValue>
        )}
      </SelectTrigger>
      <SelectContent>
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
