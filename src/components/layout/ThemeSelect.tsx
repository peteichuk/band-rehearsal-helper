import { Moon, Sun, SunMoon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { setTheme, useAppPreferences, type ThemePreference } from '@/lib/appPreferences';

const THEME_ICON: Record<ThemePreference, typeof Sun> = {
  light: Sun,
  dark: Moon,
  auto: SunMoon,
};

const THEME_LABEL_KEY: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  auto: 'Auto',
};

/** Compact theme picker — a row inside the burger menu (Header), right above Settings. 'auto' (the default) follows the OS. */
export function ThemeSelect() {
  const { t } = useTranslation();
  const { theme } = useAppPreferences();

  return (
    <Select value={theme} onValueChange={value => setTheme(value as ThemePreference)}>
      <SelectTrigger
        size="sm"
        title={t('Theme: {{theme}}', { theme: t(THEME_LABEL_KEY[theme]) })}
        className="w-auto gap-1 border-0 bg-transparent font-normal hover:bg-transparent focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent"
      >
        <SelectValue>{t(THEME_LABEL_KEY[theme])}</SelectValue>
      </SelectTrigger>
      {/* position="popper" (not the shared component's default
          "item-aligned") because this trigger sits right at the screen's
          edge inside the menu sheet — item-aligned mode has no viewport
          collision handling, so the menu could render partly off-screen and
          cause horizontal overflow; popper mode keeps it clamped inside the
          viewport. */}
      <SelectContent position="popper" align="end" sideOffset={4} className="min-w-28">
        {(Object.keys(THEME_LABEL_KEY) as ThemePreference[]).map(id => {
          const ItemIcon = THEME_ICON[id];
          return (
            <SelectItem key={id} value={id}>
              <ItemIcon className="w-4 h-4" />
              {t(THEME_LABEL_KEY[id])}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
