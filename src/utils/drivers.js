import { getDisplayName } from "./userUtils";

/** Display name for a driver profile (the linked user account carries the name) */
export const driverName = (driver) => (driver?.user ? getDisplayName(driver.user) : "Unnamed driver");

/** The user id the admin enable/disable endpoints expect (profile id == user id today) */
export const driverUserId = (driver) => driver?.userId || driver?.user?.id || driver?.id;

/** Rider state: `status` = allowed to take jobs, `offline` = off duty */
export const driverStatus = (driver) => {
  if (!driver?.status) return { label: "Disabled", tone: "neutral" };
  if (driver?.offline) return { label: "Offline", tone: "warning" };
  return { label: "Available", tone: "success" };
};

/** Show only the last digits of bank/identity numbers */
export const masked = (value, visible = 4) => {
  if (!value) return null;
  const text = String(value);
  return text.length <= visible ? text : `${"•".repeat(Math.min(6, text.length - visible))}${text.slice(-visible)}`;
};
