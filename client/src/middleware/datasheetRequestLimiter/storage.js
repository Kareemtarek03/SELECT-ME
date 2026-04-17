import {
  DATASHEET_VIEW_LIMIT,
  DATASHEET_VIEW_STORAGE_KEY,
} from "./config";

function isBrowserStorageAvailable() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

export function getDatasheetViewCount() {
  if (!isBrowserStorageAvailable()) return 0;

  const raw = window.localStorage.getItem(DATASHEET_VIEW_STORAGE_KEY);
  const parsed = Number.parseInt(raw ?? "0", 10);

  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

export function setDatasheetViewCount(count) {
  if (!isBrowserStorageAvailable()) return;

  const normalized = Number.isFinite(count)
    ? Math.max(0, Math.floor(count))
    : 0;

  window.localStorage.setItem(
    DATASHEET_VIEW_STORAGE_KEY,
    String(normalized),
  );
}

export function incrementDatasheetViewCount() {
  const nextCount = getDatasheetViewCount() + 1;
  setDatasheetViewCount(nextCount);
  return nextCount;
}

export function clearDatasheetViewCount() {
  if (!isBrowserStorageAvailable()) return;
  window.localStorage.removeItem(DATASHEET_VIEW_STORAGE_KEY);
}

export function hasReachedDatasheetViewLimit() {
  return getDatasheetViewCount() >= DATASHEET_VIEW_LIMIT;
}

export function getRemainingDatasheetViews() {
  const remaining = DATASHEET_VIEW_LIMIT - getDatasheetViewCount();
  return Math.max(0, remaining);
}