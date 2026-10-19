export type CatalogViewMode = 'library' | 'setlists';

export interface PageActions {
  showBack: boolean;
  /** Where the header's back arrow goes instead of the catalog root — e.g. the setlist a song was opened from. */
  backTo: string | null;
  showPrint: boolean;
  shareTitle: string | null;
}

export const DEFAULT_PAGE_ACTIONS: PageActions = {
  showBack: false,
  backTo: null,
  showPrint: false,
  shareTitle: null,
};
