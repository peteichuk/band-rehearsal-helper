import { useQuery } from '@tanstack/react-query';
import { getFirstSheetTitle } from '@/lib/google/sheetsWrite';

export function useSheetTitle(
  tableId: string | null,
  accessToken: string | null,
  enabled: boolean
) {
  return useQuery({
    // accessToken left out of the key for the same reason as useEditAccess:
    // it rotates silently every ~55min without the sheet's title ever
    // changing, so keying on it would refire this pointlessly on rotation.
    queryKey: ['sheetTitle', tableId],
    queryFn: () => getFirstSheetTitle(tableId as string, accessToken as string),
    enabled: enabled && Boolean(tableId) && Boolean(accessToken),
    staleTime: 60 * 60 * 1000,
  });
}
