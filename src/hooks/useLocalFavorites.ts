import { useSyncExternalStore } from 'react';
import {
  getLocalFavoritesSnapshot,
  subscribeLocalFavorites,
  toggleLocalFavorite,
} from '@/lib/localFavorites';

/** Per-browser favorites a user marks locally — this is what prev/next navigates within. */
export function useLocalFavorites() {
  const favorites = useSyncExternalStore(subscribeLocalFavorites, getLocalFavoritesSnapshot);

  return {
    isFavorite: (name: string) => favorites.has(name),
    toggleFavorite: toggleLocalFavorite,
  };
}
