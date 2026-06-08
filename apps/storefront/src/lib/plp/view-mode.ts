export type PlpViewMode = "grid" | "list";

export const PLP_VIEW_MODE_STORAGE_KEY = "jeyjo-plp-view-mode";

export function readPlpViewMode(): PlpViewMode {
  if (typeof window === "undefined") return "grid";
  try {
    const stored = window.localStorage.getItem(PLP_VIEW_MODE_STORAGE_KEY);
    return stored === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

export function writePlpViewMode(mode: PlpViewMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PLP_VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore quota / private mode
  }
}
