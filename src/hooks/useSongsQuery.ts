import { useQuery } from '@tanstack/react-query';
import { fetchSongs } from '@/lib/sheets/gviz';

export function useSongsQuery(tableId: string | null) {
  return useQuery({
    queryKey: ['songs', tableId],
    queryFn: () => fetchSongs(tableId as string),
    enabled: !!tableId,
    staleTime: 5 * 60 * 1000,
  });
}
