import { Link } from "react-router-dom";
import { PiArrowLeft, PiCompass } from "react-icons/pi";
import { getAdminToken } from "../api/authHelper";
import Button from "../components/ui/Button";

const ErrorPage = () => {
  const home = getAdminToken() ? "/admin/dashboard" : "/";

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-stone-50 px-6">
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(64_9_69/0.08),transparent_65%)]" />
      <div className="relative max-w-md text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-900 text-white shadow-card">
          <PiCompass className="size-7" />
        </span>
        <p className="tabular mt-6 text-sm font-medium text-brand-700">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">This page doesn't exist</h1>
        <p className="mt-3 text-stone-500">The link may be broken, or the page may have moved.</p>
        <Button as={Link} to={home} icon={PiArrowLeft} className="mt-8">
          Back to {home === "/" ? "sign in" : "the dashboard"}
        </Button>
      </div>
    </main>
  );
};

export default ErrorPage;
