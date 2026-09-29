import { Link } from "react-router-dom";
import { PiArrowUpRight } from "react-icons/pi";
import { Skeleton } from "./States";

/** StatCard - headline number with a link through to its list */
export default function StatCard({ label, value, icon: Icon, to, hint, loading, featured = false }) {
  const surface = featured
    ? "bg-brand-900 text-white ring-brand-900"
    : "bg-white text-stone-900 ring-stone-200/70 hover:ring-brand-200";
  return (
    <Link
      to={to}
      className={`group relative flex flex-col justify-between gap-6 overflow-hidden rounded-2xl p-5 shadow-card ring-1 transition duration-200 hover:-translate-y-0.5 ${surface}`}
    >
      {featured && (
        <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-[radial-gradient(circle,rgb(216_27_96/0.35),transparent_70%)]" />
      )}
      <div className="relative flex items-center justify-between">
        <span className={`text-sm font-medium ${featured ? "text-brand-100" : "text-stone-500"}`}>{label}</span>
        <span
          className={`flex size-9 items-center justify-center rounded-xl ${featured ? "bg-white/10 text-white" : "bg-brand-50 text-brand-800"}`}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <div className="relative flex items-end justify-between gap-2">
        <div>
          {loading ? (
            <Skeleton className={`h-9 w-16 ${featured ? "bg-white/20" : ""}`} />
          ) : (
            <p className="tabular text-4xl font-semibold tracking-tight">{value}</p>
          )}
          {hint && <p className={`mt-1 text-xs ${featured ? "text-brand-200" : "text-stone-400"}`}>{hint}</p>}
        </div>
        <PiArrowUpRight
          className={`size-5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${featured ? "text-brand-200" : "text-stone-300 group-hover:text-brand-700"}`}
        />
      </div>
    </Link>
  );
}
