import { getDisplayName } from "./userUtils";

/** Display name for a driver profile (the linked user account carries the name) */
export const driverName = (driver) => (driver?.user ? getDisplayName(driver.user) : "Unnamed driver");

/** The user id the admin enable/disable endpoints expect (profile id == user id today) */
export const driverUserId = (driver) => driver?.userId || driver?.user?.id || driver?.id;

/**
 * Rider state: `status` = approved to take jobs, `offline` = off duty. A rider who is off and was
 * never switched off by an admin is new and waiting for approval.
 */
export const driverStatus = (driver) => {
  if (!driver?.status && driver?.disabledByAdmin) return { label: "Disabled", tone: "neutral" };
  if (!driver?.status) return { label: "Awaiting approval", tone: "warning" };
  if (driver?.offline) return { label: "Offline", tone: "warning" };
  return { label: "Available", tone: "success" };
};

/** Show only the last digits of bank/identity numbers */
export const masked = (value, visible = 4) => {
  if (!value) return null;
  const text = String(value);
  return text.length <= visible ? text : `${"•".repeat(Math.min(6, text.length - visible))}${text.slice(-visible)}`;
};
