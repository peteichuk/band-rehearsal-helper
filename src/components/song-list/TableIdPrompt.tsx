import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PRIMARY_BUTTON_CLASS } from '@/components/layout/headerButtonStyles';
import { cn } from '@/lib/utils';

interface TableIdPromptProps {
  initialValue: string;
  onLoad: (value: string) => void;
  loading?: boolean;
}

export function TableIdPrompt({ initialValue, onLoad, loading = false }: TableIdPromptProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);

  const submit = () => {
    if (value.trim()) onLoad(value.trim());
  };

  return (
    <div className="flex items-center gap-2 max-w-md w-full">
      <input
        type="text"
        placeholder={t('Google Sheets ID or URL')}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') submit();
        }}
        autoComplete="off"
        disabled={loading}
        className="h-9 flex-1 px-2 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[100px] w-full disabled:opacity-60"
      />
      <button
        type="button"
        className={cn(PRIMARY_BUTTON_CLASS, 'disabled:opacity-60 disabled:pointer-events-none')}
        onClick={submit}
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            {t('Loading…')}
          </span>
        ) : (
          t('Load')
        )}
      </button>
    </div>
  );
}
