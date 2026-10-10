import { useQuery } from '@tanstack/react-query';
import { getFirstSheetTitle } from '@/lib/google/sheetsWrite';

export function useSheetTitle(
  tableId: string | null,
  accessToken: string | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: ['sheetTitle', tableId, accessToken],
    queryFn: () => getFirstSheetTitle(tableId as string, accessToken as string),
    enabled: enabled && Boolean(tableId) && Boolean(accessToken),
    staleTime: 60 * 60 * 1000,
  });
}
