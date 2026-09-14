export {}

declare global {
  interface Window {
    __ONDO_B_TABLE_INTENT__?: { tableId: string; venueId: string; mode: "view" }
  }
}
