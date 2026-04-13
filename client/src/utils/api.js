// Resolve the API base URL. CRA bakes process.env.REACT_APP_* at build time.
// If the env var is not set, CRA replaces it with the literal string "undefined",
// so a simple `|| ""` fallback does NOT work. We must also check for that string.
const raw = process.env.REACT_APP_API_BASE_URL;
export const API_BASE = raw && raw !== "undefined" ? raw : "";
