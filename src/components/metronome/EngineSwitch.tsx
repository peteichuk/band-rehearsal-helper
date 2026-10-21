import { Button } from '@/components/ui/button';

export type MetronomeEngine = 'local' | 'iframe';

interface EngineSwitchProps {
  value: MetronomeEngine;
  onChange: (engine: MetronomeEngine) => void;
}

export function EngineSwitch({ value, onChange }: EngineSwitchProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      <Button
        type="button"
        variant={value === 'local' ? 'secondary' : 'ghost'}
        onClick={() => onChange('local')}
      >
        Local
      </Button>
      <Button
        type="button"
        variant={value === 'iframe' ? 'secondary' : 'ghost'}
        onClick={() => onChange('iframe')}
      >
        External (guitarapp.com)
      </Button>
    </div>
  );
}
