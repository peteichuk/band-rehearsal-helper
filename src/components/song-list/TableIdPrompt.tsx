import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface TableIdPromptProps {
  initialValue: string;
  onLoad: (value: string) => void;
}

export function TableIdPrompt({ initialValue, onLoad }: TableIdPromptProps) {
  const [value, setValue] = useState(initialValue);

  const submit = () => {
    if (value.trim()) onLoad(value.trim());
  };

  return (
    <div className="flex items-center gap-2 max-w-md w-full">
      <input
        type="text"
        placeholder="Google Sheets ID or URL"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') submit();
        }}
        autoComplete="off"
        className="h-9 flex-1 px-2 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[100px] w-full"
      />
      <Button type="button" className="h-9" onClick={submit}>
        Load
      </Button>
    </div>
  );
}
