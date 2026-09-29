import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PiCaretLeft, PiCaretRight, PiCaretUpDown, PiCaretUp, PiCaretDown, PiMagnifyingGlass, PiTray } from "react-icons/pi";
import { Card } from "./Card";
import { Skeleton, EmptyState, ErrorState } from "./States";

/** pageWindow - page numbers to show, with "…" gaps: 1 … 4 5 6 … 12 */
const pageWindow = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return sorted.flatMap((page, i) => (i > 0 && page - sorted[i - 1] > 1 ? ["gap-" + page, page] : [page]));
};

/**
 * DataTable - client-side search, filter tabs, sorting and pagination over an in-memory list.
 *
 * columns: [{ key, header, render(row), sortValue?(row), className?, mobileHidden? }]
 * filters: [{ label, value, predicate(row) }] shown as tabs; the first is the default
 * rowHref(row): makes rows clickable (navigates on click / Enter)
 */
export default function DataTable({
  columns,
  rows = [],
  loading = false,
  error = null,
  onRetry,
  getRowKey = (row, index) => row?.id ?? index,
  searchText,
  searchPlaceholder = "Search…",
  filters,
  rowHref,
  pageSize = 10,
  empty = {},
  toolbar,
  initialSort,
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(filters?.[0]?.value);
  const [sort, setSort] = useState(initialSort || null); // { key, dir: "asc" | "desc" }
  const [page, setPage] = useState(1);

  const activeFilter = filters?.find((f) => f.value === filter);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows;
    if (activeFilter?.predicate) list = list.filter(activeFilter.predicate);
    if (q && searchText) list = list.filter((row) => searchText(row).toLowerCase().includes(q));
    if (sort) {
      const column = columns.find((c) => c.key === sort.key);
      if (column?.sortValue) {
        list = [...list].sort((a, b) => {
          const av = column.sortValue(a);
          const bv = column.sortValue(b);
          const result = typeof av === "number" && typeof bv === "number" ? av - bv : String(av ?? "").localeCompare(String(bv ?? ""));
          return sort.dir === "asc" ? result : -result;
        });
      }
    }
    return list;
  }, [rows, query, activeFilter, sort, columns, searchText]);

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRows = visible.slice(start, start + pageSize);

  const toggleSort = (column) => {
    if (!column.sortValue) return;
    setSort((prev) => (prev?.key === column.key ? { key: column.key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key: column.key, dir: "asc" }));
  };

  const open = (row) => rowHref && navigate(rowHref(row));
  const rowProps = (row) =>
    rowHref
      ? {
          onClick: () => open(row),
          onKeyDown: (event) => event.key === "Enter" && open(row),
          tabIndex: 0,
          role: "link",
          className: "cursor-pointer transition hover:bg-brand-50/40 focus-visible:bg-brand-50/60 focus-visible:outline-none",
        }
      : {};

  const isFiltered = Boolean(query.trim()) || (filters && filter !== filters[0].value);

  return (
    <Card className="overflow-hidden">
      {/* Toolbar */}
      {(searchText || filters || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-stone-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          {filters ? (
            <div className="flex gap-1 overflow-x-auto rounded-lg bg-stone-100 p-1" role="tablist">
              {filters.map((f) => {
                const count = f.predicate ? rows.filter(f.predicate).length : rows.length;
                const active = f.value === filter;
                return (
                  <button
                    key={f.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setFilter(f.value);
                      setPage(1);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
                      active ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    {f.label}
                    {!loading && <span className={`tabular text-xs ${active ? "text-brand-700" : "text-stone-400"}`}>{count}</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            {searchText && (
              <div className="relative w-full lg:w-72">
                <PiMagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  className="h-9 w-full rounded-lg border-0 bg-stone-50 pr-3 pl-9 text-sm ring-1 ring-inset ring-stone-200 transition placeholder:text-stone-400 focus:bg-white focus:ring-2 focus:ring-brand-600 focus:outline-none"
                />
              </div>
            )}
            {toolbar}
          </div>
        </div>
      )}

      {error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/60">
                  {columns.map((column) => {
                    const sorted = sort?.key === column.key ? sort.dir : null;
                    const SortIcon = sorted === "asc" ? PiCaretUp : sorted === "desc" ? PiCaretDown : PiCaretUpDown;
                    return (
                      <th
                        key={column.key}
                        scope="col"
                        aria-sort={sorted ? (sorted === "asc" ? "ascending" : "descending") : undefined}
                        className={`px-5 py-3 text-xs font-medium tracking-wide text-stone-500 ${column.className || ""}`}
                      >
                        {column.sortValue ? (
                          <button type="button" onClick={() => toggleSort(column)} className="inline-flex items-center gap-1 transition hover:text-stone-900">
                            {column.header}
                            <SortIcon className={`size-3.5 ${sorted ? "text-brand-700" : "text-stone-300"}`} />
                          </button>
                        ) : (
                          column.header
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading
                  ? Array.from({ length: 5 }, (_, i) => (
                      <tr key={i}>
                        {columns.map((column, c) => (
                          <td key={column.key} className="px-5 py-4">
                            <Skeleton className={`h-4 ${c === 0 ? "w-40" : "w-20"}`} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : pageRows.map((row, index) => (
                      <tr key={getRowKey(row, start + index)} {...rowProps(row)}>
                        {columns.map((column) => (
                          <td key={column.key} className={`px-5 py-3.5 align-middle text-stone-700 ${column.className || ""}`}>
                            {column.render ? column.render(row) : row[column.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-stone-100 md:hidden">
            {loading
              ? Array.from({ length: 4 }, (_, i) => (
                  <li key={i} className="space-y-2 p-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </li>
                ))
              : pageRows.map((row, index) => (
                  <li key={getRowKey(row, start + index)} {...rowProps(row)}>
                    <div className="space-y-2 p-4">
                      {columns
                        .filter((column) => !column.mobileHidden)
                        .map((column, c) =>
                          c === 0 ? (
                            <div key={column.key}>{column.render ? column.render(row) : row[column.key]}</div>
                          ) : (
                            <div key={column.key} className="flex items-center justify-between gap-4 text-sm">
                              <span className="text-stone-500">{column.header}</span>
                              <span className="text-right text-stone-800">{column.render ? column.render(row) : row[column.key]}</span>
                            </div>
                          )
                        )}
                    </div>
                  </li>
                ))}
          </ul>

          {!loading && visible.length === 0 && (
            <EmptyState
              icon={empty.icon || PiTray}
              title={isFiltered ? "No matches" : empty.title || "Nothing here yet"}
              description={isFiltered ? "Try a different search or filter." : empty.description}
              action={isFiltered ? null : empty.action}
            />
          )}
        </>
      )}

      {/* Pagination */}
      {!loading && !error && visible.length > 0 && (
        <nav className="flex flex-col items-center justify-between gap-3 border-t border-stone-100 px-5 py-3 text-sm sm:flex-row" aria-label="Pagination">
          <p className="tabular text-stone-500">
            Showing <span className="font-medium text-stone-800">{start + 1}</span>–
            <span className="font-medium text-stone-800">{Math.min(start + pageSize, visible.length)}</span> of{" "}
            <span className="font-medium text-stone-800">{visible.length}</span>
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="inline-flex size-8 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 disabled:pointer-events-none disabled:opacity-40"
              >
                <PiCaretLeft className="size-4" />
              </button>
              {pageWindow(currentPage, totalPages).map((p) =>
                typeof p === "string" ? (
                  <span key={p} className="px-1 text-stone-400">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    aria-current={p === currentPage ? "page" : undefined}
                    className={`tabular inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 font-medium transition ${
                      p === currentPage ? "bg-brand-900 text-white" : "text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="inline-flex size-8 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 disabled:pointer-events-none disabled:opacity-40"
              >
                <PiCaretRight className="size-4" />
              </button>
            </div>
          )}
        </nav>
      )}
    </Card>
  );
}
