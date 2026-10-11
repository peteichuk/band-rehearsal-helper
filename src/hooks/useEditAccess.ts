import { useQuery } from '@tanstack/react-query';
import { checkCanEdit } from '@/lib/google/drive';

/** Whether the currently signed-in user has edit rights on this specific sheet. */
export function useEditAccess(tableId: string | null, accessToken: string | null): boolean {
  const { data } = useQuery({
    // accessToken deliberately left out of the key: it rotates silently
    // every ~55min (see useGoogleAuth) without the permission it grants
    // ever changing, so keying on it would refire this on every rotation
    // for no reason — queryFn always closes over whatever token is current.
    queryKey: ['canEdit', tableId],
    queryFn: () => checkCanEdit(tableId as string, accessToken as string),
    enabled: Boolean(tableId) && Boolean(accessToken),
    staleTime: 5 * 60 * 1000,
  });

  return data ?? false;
}
