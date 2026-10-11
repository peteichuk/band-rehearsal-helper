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
