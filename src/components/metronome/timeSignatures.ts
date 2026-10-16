export interface TimeSignature {
  id: string;
  label: string;
  beatsPerBar: number;
}

export const TIME_SIGNATURES: TimeSignature[] = [
  { id: '2-4', label: '2/4', beatsPerBar: 2 },
  { id: '3-4', label: '3/4', beatsPerBar: 3 },
  { id: '4-4', label: '4/4', beatsPerBar: 4 },
  { id: '5-4', label: '5/4', beatsPerBar: 5 },
  { id: '6-8', label: '6/8', beatsPerBar: 6 },
  { id: '7-8', label: '7/8', beatsPerBar: 7 },
  { id: '9-8', label: '9/8', beatsPerBar: 9 },
  { id: '12-8', label: '12/8', beatsPerBar: 12 },
];

export const DEFAULT_TIME_SIGNATURE_ID = '4-4';

export function getTimeSignature(id: string): TimeSignature {
  return TIME_SIGNATURES.find(signature => signature.id === id) ?? TIME_SIGNATURES[2];
}

/**
 * Resolves a sheet-style value (e.g. the song's `TimeSignature` cell, written
 * as "4/4", "3/4", "6/8" — the same way a musician would) to its internal id.
 * Falls back to the default when the song has no value or it doesn't match
 * any known signature.
 */
export function getTimeSignatureIdFromLabel(label: string | null | undefined): string {
  const trimmed = label?.trim();
  if (!trimmed) return DEFAULT_TIME_SIGNATURE_ID;
  return (
    TIME_SIGNATURES.find(signature => signature.label === trimmed)?.id ?? DEFAULT_TIME_SIGNATURE_ID
  );
}
