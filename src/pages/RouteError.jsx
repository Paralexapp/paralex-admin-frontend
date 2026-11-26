import { useEffect } from "react";
import { Link, useRouteError } from "react-router-dom";
import { PiArrowClockwise, PiArrowLeft, PiWarningCircle } from "react-icons/pi";
import { getAdminToken } from "../api/authHelper";
import Button from "../components/ui/Button";

const STALE = /dynamically imported module|Importing a module script failed|error loading dynamically imported|Loading chunk|Unable to preload CSS/i;
const KEY = "paralex-reloaded-for-update";

/** After a deploy, an open tab asks for page files that no longer exist. Reload once to get the new ones. */
export const reloadForUpdate = () => {
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < 15000) return false; // already tried just now: don't loop
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // storage blocked: reload anyway, once per page view
  }
  window.location.reload();
  return true;
};

export const isStaleVersionError = (error) => STALE.test(String(error?.message || error || ""));

/** Shown when a page fails to load or crashes, instead of React Router's developer screen. */
export default function RouteError() {
  const error = useRouteError();
  const stale = isStaleVersionError(error);
  const home = getAdminToken() ? "/admin/dashboard" : "/";

  useEffect(() => {
    if (stale) reloadForUpdate();
  }, [stale]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-stone-50 px-6">
      <div className="max-w-md text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-900 text-white shadow-card">
          {stale ? <PiArrowClockwise className="size-7" /> : <PiWarningCircle className="size-7" />}
        </span>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-stone-900">
          {stale ? "The dashboard was updated" : "Something went wrong"}
        </h1>
        <p className="mt-3 text-stone-500">
          {stale
            ? "Loading the latest version. If this page stays, tap Reload."
            : "This page couldn't load. Reload to try again, or go back to the dashboard."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button icon={PiArrowClockwise} onClick={() => window.location.reload()}>
            Reload
          </Button>
          <Button as={Link} to={home} variant="secondary" icon={PiArrowLeft}>
            Back to {home === "/" ? "sign in" : "the dashboard"}
          </Button>
        </div>
      </div>
    </main>
  );
}
