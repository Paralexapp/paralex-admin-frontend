import { Link } from "react-router-dom";
import { PiArrowLeft } from "react-icons/pi";

/** PageHeader - title, optional description/back link, and page-level actions */
export default function PageHeader({ title, description, back, actions }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back && (
          <Link
            to={back.to}
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 transition hover:text-brand-800"
          >
            <PiArrowLeft className="size-4" />
            {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-stone-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
