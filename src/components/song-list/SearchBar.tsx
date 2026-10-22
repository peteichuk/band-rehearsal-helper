import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const DEBOUNCE_MS = 300;

/**
 * `value`/`onChange` are backed by the URL's own `q` param one level up
 * (see SongListPage) — calling `onChange` on every keystroke there means
 * every keystroke rewrites the URL *and* re-filters the whole song list,
 * which is what was making typing feel laggy. Local state here gives
 * instant typing feedback, and `onChange` only actually fires `DEBOUNCE_MS`
 * after the user stops typing.
 */
export function SearchBar({ value, onChange, disabled }: SearchBarProps) {
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<number | null>(null);

  // Only fires when `value` itself changes — i.e. an *external* change (the
  // list getting cleared by navigating away and back, a shared link with
  // its own ?q=), never while a debounce from our own typing is in flight.
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const scheduleChange = (next: string) => {
    setLocalValue(next);
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => onChange(next), DEBOUNCE_MS);
  };

  const clear = () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    setLocalValue('');
    onChange('');
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={t('Search songs…')}
        value={localValue}
        disabled={disabled}
        onChange={e => scheduleChange(e.target.value)}
        autoComplete="off"
        // text-base (16px) is deliberate, not just the usual size — iOS
        // Safari auto-zooms the page on focus for any input with a
        // computed font-size under 16px.
        className="w-full py-[7px] px-3 pr-10 text-base rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {localValue ? (
        <button
          type="button"
          aria-label={t('Clear search')}
          onClick={clear}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-2.5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>
      ) : (
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
      )}
    </div>
  );
}
