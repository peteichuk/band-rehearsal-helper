import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { setLocale, useAppPreferences, type LocalePreference } from '@/lib/appPreferences';
import { LOCALE_OPTIONS } from '@/lib/locale';

/** App UI language — 'auto' (the default) follows the browser/OS language (see useLocale.ts), same pattern as ThemeSelect's 'auto'. */
export function SettingsLanguageSection() {
  const { t } = useTranslation();
  const { locale } = useAppPreferences();

  const triggerLabel =
    locale === 'auto'
      ? t('Auto (system)')
      : (() => {
          const option = LOCALE_OPTIONS.find(o => o.value === locale);
          return option ? `${option.flag} ${option.code} ${option.label}` : locale;
        })();

  return (
    <Select value={locale} onValueChange={value => setLocale(value as LocalePreference)}>
      <SelectTrigger className="w-full">
        <SelectValue>{triggerLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="auto">{t('Auto (system)')}</SelectItem>
        {LOCALE_OPTIONS.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.flag} {option.code} {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
