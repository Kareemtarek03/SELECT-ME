import { DATASHEET_VIEW_LIMIT } from "./config";
import {
  clearDatasheetViewCount,
  getRemainingDatasheetViews,
  hasReachedDatasheetViewLimit,
  incrementDatasheetViewCount,
} from "./storage";

export function canRequestDatasheet() {
  return !hasReachedDatasheetViewLimit();
}

export function registerDatasheetView() {
  return incrementDatasheetViewCount();
}

export function getDatasheetLimitMessage() {
  return `You have reached the datasheet view limit (${DATASHEET_VIEW_LIMIT}).`;
}

export function getDatasheetRemainingMessage() {
  const remaining = getRemainingDatasheetViews();
  if (remaining === 1) return "1 datasheet view remaining.";
  return `${remaining} datasheet views remaining.`;
}

export function resetDatasheetRequestLimit() {
  clearDatasheetViewCount();
}