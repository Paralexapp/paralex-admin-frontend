/**
 * Helpers for LCIS (inmate) and BIMS (bail) records. Both are external PHP APIs; Paralex's
 * backend relays them so their API keys never reach the browser.
 */

/** The record list inside an API reply: {data: {sureties: [...]}} (BIMS), {data: {inmates: [...]}}, or a bare array */
export const extractList = (response) => {
  if (Array.isArray(response)) return response;
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data;
  const firstArray = data && Object.values(data).find(Array.isArray);
  return firstArray || [];
};

/** A single record inside an API reply: {data: {...}} or the object itself */
export const extractRecord = (response) => {
  const data = response?.data ?? response;
  if (data && !Array.isArray(data) && typeof data === "object") {
    const inner = Object.values(data).find((v) => v && typeof v === "object" && !Array.isArray(v));
    // {data: {inmate: {...}}} -> the inner record; {data: {...fields}} -> data itself
    return Object.keys(data).length === 1 && inner ? inner : data;
  }
  return null;
};

/** The total count the API reports, when it paginates */
export const extractTotal = (response, fallback) => response?.data?.total ?? fallback;

/** snake_case / camelCase key -> label: "defendant_court_magname" -> "Defendant court magname" */
export const labelFor = (key) => {
  const words = String(key).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase().trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** Treat the API's placeholder values as blank */
export const present = (value) => value !== null && value !== undefined && value !== "" && value !== "0";

/** Photographs come back base64-encoded, with or without the data: prefix */
export const photoSrc = (value) => {
  if (!present(value) || typeof value !== "string") return null;
  if (value.startsWith("data:") || value.startsWith("http")) return value;
  return `data:image/jpeg;base64,${value}`;
};

export const personName = (record) =>
  record?.full_name ||
  [record?.first_name, record?.othername, record?.last_name].filter(present).join(" ") ||
  [record?.defendant_first_name, record?.defendant_last_name].filter(present).join(" ") ||
  "Unnamed";

export const bimsTone = (status) => {
  const s = String(status || "").toLowerCase();
  if (s.includes("approv") || s.includes("success") || s.includes("released") || s === "found") return "success";
  if (s.includes("reject") || s.includes("fail") || s.includes("not found")) return "danger";
  if (s.includes("pending")) return "warning";
  return "neutral";
};
