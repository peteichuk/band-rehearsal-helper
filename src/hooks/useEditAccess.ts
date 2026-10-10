import { useQuery } from '@tanstack/react-query';
import { checkCanEdit } from '@/lib/google/drive';

/** Whether the currently signed-in user has edit rights on this specific sheet. */
export function useEditAccess(tableId: string | null, accessToken: string | null): boolean {
  const { data } = useQuery({
    queryKey: ['canEdit', tableId, accessToken],
    queryFn: () => checkCanEdit(tableId as string, accessToken as string),
    enabled: Boolean(tableId) && Boolean(accessToken),
    staleTime: 5 * 60 * 1000,
  });

  return data ?? false;
}
