import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SearchBar({ value, onChange, disabled }: SearchBarProps) {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search songs..."
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        autoComplete="off"
        className="w-full px-3 pr-9 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <X className="w-4 h-4" />
        </button>
      ) : (
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
      )}
    </div>
  );
}
