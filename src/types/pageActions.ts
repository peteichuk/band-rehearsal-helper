export interface PageActions {
  showBack: boolean;
  showPrint: boolean;
  shareTitle: string | null;
  metronomeBpm: number | null;
}

export const DEFAULT_PAGE_ACTIONS: PageActions = {
  showBack: false,
  showPrint: false,
  shareTitle: null,
  metronomeBpm: null,
};
