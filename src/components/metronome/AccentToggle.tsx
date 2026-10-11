import { Button } from '@/components/ui/button';

interface AccentToggleProps {
  accentFirstBeat: boolean;
  onChange: (accentFirstBeat: boolean) => void;
}

export function AccentToggle({ accentFirstBeat, onChange }: AccentToggleProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant={accentFirstBeat ? 'secondary' : 'outline'}
      onClick={() => onChange(!accentFirstBeat)}
    >
      Accent {accentFirstBeat ? 'On' : 'Off'}
    </Button>
  );
}
