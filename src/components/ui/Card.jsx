/** Card - the standard white surface */
export function Card({ as: Component = "section", className = "", children, ...props }) {
  return (
    <Component className={`rounded-2xl bg-white shadow-card ring-1 ring-stone-200/70 ${className}`} {...props}>
      {children}
    </Component>
  );
}

export function CardHeader({ title, description, actions, className = "" }) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 px-5 py-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-stone-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-stone-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
