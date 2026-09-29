import { PiInfo, PiWarningCircle } from "react-icons/pi";
import Button from "./Button";

/** Skeleton - shimmering placeholder block */
export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-stone-200/70 ${className}`} />;
}

/** EmptyState - shown when a list or panel has nothing in it */
export function EmptyState({ icon: Icon, title, description, action, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${className}`}>
      {Icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <Icon className="size-6" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-stone-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** ErrorState - a failed load, with a retry */
export function ErrorState({ message, onRetry, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${className}`}>
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <PiWarningCircle className="size-6" />
      </div>
      <h3 className="text-sm font-semibold text-stone-900">Couldn't load this</h3>
      <p className="mt-1 max-w-sm text-sm text-stone-500">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Notice - inline banner; used to flag screens that still run on sample data */
export function Notice({ tone = "info", title, children, className = "" }) {
  const styles =
    tone === "warning"
      ? "bg-amber-50 text-amber-900 ring-amber-200"
      : "bg-brand-50 text-brand-900 ring-brand-200";
  return (
    <div className={`flex gap-3 rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${styles} ${className}`} role="status">
      <PiInfo className="mt-0.5 size-4 shrink-0" />
      <div>
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={title ? "mt-0.5 opacity-80" : ""}>{children}</div>}
      </div>
    </div>
  );
}

/** SampleDataNotice - honest label for pages not yet wired to the API */
export function SampleDataNotice({ children }) {
  return (
    <Notice tone="warning" title="Not connected to the API yet" className="mb-6">
      {children || "This screen shows sample data and its actions don't save anything."}
    </Notice>
  );
}
