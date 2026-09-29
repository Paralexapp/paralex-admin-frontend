import {
  PiSquaresFour,
  PiUsers,
  PiGavel,
  PiSteeringWheel,
  PiScales,
  PiPackage,
  PiArrowsLeftRight,
  PiNewspaper,
  PiGearSix,
  PiSealCheck,
} from "react-icons/pi";
import { ADMIN_VERIFYLAWYER_URL } from "../utils/constants";

/** Sidebar structure. `match` lists extra path prefixes that should highlight the item. */
export const navSections = [
  {
    label: "Overview",
    items: [{ to: "/admin/dashboard", label: "Dashboard", icon: PiSquaresFour, match: ["/admin"] }],
  },
  {
    label: "People",
    items: [
      { to: "/admin/users", label: "Users", icon: PiUsers, match: ["/admin/user/", "/admin/add-user"] },
      { to: "/admin/lawyers", label: "Lawyers", icon: PiGavel, match: ["/admin/lawyer/", "/admin/add-lawyer"] },
      { to: "/admin/drivers", label: "Drivers", icon: PiSteeringWheel, match: ["/admin/driver/", "/admin/add-driver"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/admin/bailbond", label: "Bail bonds", icon: PiScales },
      { to: "/admin/logistics", label: "Deliveries", icon: PiPackage },
      { to: "/admin/transaction", label: "Transactions", icon: PiArrowsLeftRight },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/admin/post-news", label: "Post news", icon: PiNewspaper },
      { href: ADMIN_VERIFYLAWYER_URL, label: "Verify a lawyer", icon: PiSealCheck, external: true },
    ],
  },
  {
    label: "Settings",
    items: [{ to: "/admin/settings", label: "Admins", icon: PiGearSix }],
  },
];

/** Page titles for the top bar, by path prefix (longest match wins) */
const titles = [
  ["/admin/dashboard", "Dashboard"],
  ["/admin/users", "Users"],
  ["/admin/user/", "User profile"],
  ["/admin/add-user", "Add user"],
  ["/admin/lawyers", "Lawyers"],
  ["/admin/lawyer/", "Lawyer profile"],
  ["/admin/add-lawyer", "Add lawyer"],
  ["/admin/drivers", "Drivers"],
  ["/admin/driver/", "Driver profile"],
  ["/admin/add-driver", "Add driver"],
  ["/admin/bailbond/", "Bail bond request"],
  ["/admin/bailbond", "Bail bonds"],
  ["/admin/logistics", "Deliveries"],
  ["/admin/transaction", "Transactions"],
  ["/admin/post-news", "Post news"],
  ["/admin/settings", "Admins"],
  ["/admin/notifications", "Notifications"],
];

export const titleFor = (pathname) =>
  titles.filter(([prefix]) => pathname.startsWith(prefix)).sort((a, b) => b[0].length - a[0].length)[0]?.[1] || "Dashboard";

export const isActive = (item, pathname) => {
  if (!item.to) return false;
  if (pathname === item.to || pathname.startsWith(item.to + "/")) return true;
  return (item.match || []).some((prefix) => (prefix === "/admin" ? pathname === "/admin" || pathname === "/admin/" : pathname.startsWith(prefix)));
};
