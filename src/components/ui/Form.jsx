import { PiCaretDown } from "react-icons/pi";

const control =
  "w-full rounded-lg border-0 bg-white px-3 text-sm text-stone-900 ring-1 ring-inset ring-stone-200 transition placeholder:text-stone-400 hover:ring-stone-300 focus:ring-2 focus:ring-brand-600 focus:outline-none disabled:bg-stone-50 disabled:text-stone-500 read-only:bg-stone-50";
const invalid = "ring-accent-500 hover:ring-accent-500";

/** Field - label + control + hint/error, so every form lines up the same way */
export function Field({ label, htmlFor, hint, error, required, className = "", children }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-stone-700">
          {label}
          {required && <span className="ml-0.5 text-accent-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-accent-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-stone-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ icon: Icon, error, className = "", ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />}
      <input
        className={`${control} h-10 ${Icon ? "pl-9" : ""} ${error ? invalid : ""} ${className}`}
        aria-invalid={error ? true : undefined}
        {...props}
      />
    </div>
  );
}

export function Select({ error, className = "", children, ...props }) {
  return (
    <div className="relative">
      <select
        className={`${control} h-10 appearance-none pr-9 ${error ? invalid : ""} ${className}`}
        aria-invalid={error ? true : undefined}
        {...props}
      >
        {children}
      </select>
      <PiCaretDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-stone-400" />
    </div>
  );
}

export function Textarea({ error, className = "", ...props }) {
  return (
    <textarea
      className={`${control} min-h-28 py-2.5 leading-relaxed ${error ? invalid : ""} ${className}`}
      aria-invalid={error ? true : undefined}
      {...props}
    />
  );
}
