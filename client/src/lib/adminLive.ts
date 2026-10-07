// Polling options for admin screens that should stay current without a page
// refresh (new orders, status changes from another device, ...). Polls only
// while the tab is visible, and react-query also refetches the moment the
// window regains focus, so an admin coming back to the app sees fresh data.
export const ADMIN_LIVE = {
  refetchInterval: 15_000,
  refetchIntervalInBackground: false,
} as const;

/** Slower cadence for data that changes rarely (e.g. the 30-day revenue chart). */
export const ADMIN_LIVE_SLOW = {
  refetchInterval: 60_000,
  refetchIntervalInBackground: false,
} as const;
