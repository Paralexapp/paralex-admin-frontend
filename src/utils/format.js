import { dateTimeArrayToDate } from "./getCurrentDateTime";

/** getInitials - up to two initials from a display name */
export const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

/** formatNaira - "₦12,500"; blank values show a dash */
export const formatNaira = (amount) =>
  amount === null || amount === undefined || amount === "" || Number.isNaN(Number(amount)) ? "—" : naira.format(Number(amount));

/** formatDate - "28 Sep 2026" from a backend date array or ISO string */
export const formatDate = (value) => {
  const iso = dateTimeArrayToDate(value, "");
  if (!iso) return "—";
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

/** toTimestamp - sortable number for a backend date (0 when missing) */
export const toTimestamp = (value) => {
  const iso = dateTimeArrayToDate(value, "");
  return iso ? new Date(iso).getTime() : 0;
};

/** humanize - "SERVICE_PROVIDER" -> "Service provider" */
export const humanize = (value) => {
  if (!value) return "—";
  const text = String(value).replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};
