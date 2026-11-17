import { cn } from '@/lib/utils';

interface SettingsCheckboxRowProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}

/** A labelled checkbox with an optional explanatory line — the shared row for on/off preferences in Settings. */
export function SettingsCheckboxRow({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
}: SettingsCheckboxRowProps) {
  return (
    <label className={cn('flex items-start gap-2', disabled ? 'opacity-50' : 'cursor-pointer')}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={event => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0"
      />
      <span>
        <span className="block text-sm">{label}</span>
        {hint && <span className="block text-xs text-gray-500 dark:text-gray-400">{hint}</span>}
      </span>
    </label>
  );
}
