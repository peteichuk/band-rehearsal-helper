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

/** Manual day/night override next to the hamburger menu — 'auto' (the default) follows the OS, same as before this existed. */
export function ThemeSelect() {
  const { t } = useTranslation();
  const { theme } = useAppPreferences();
  const Icon = THEME_ICON[theme];

  return (
    <Select value={theme} onValueChange={value => setTheme(value as ThemePreference)}>
      <SelectTrigger
        title={t('Theme: {{theme}}', { theme: t(THEME_LABEL_KEY[theme]) })}
        className="h-9 w-9 shrink-0 justify-center gap-0 rounded border-0 bg-blue-700 p-0 text-white hover:bg-blue-800 focus-visible:ring-0 dark:bg-blue-600 dark:hover:bg-blue-700 [&>svg:last-child]:hidden"
      >
        <SelectValue>
          <Icon className="w-4 h-4" />
        </SelectValue>
      </SelectTrigger>
      {/* position="popper" (not the shared component's default
          "item-aligned") because this trigger sits right at the screen's
          edge next to the hamburger — item-aligned mode has no viewport
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
