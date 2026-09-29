/** DetailList - label/value pairs in a responsive grid. items: [{ label, value, wide? }] */
export default function DetailList({ items }) {
  return (
    <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
      {items.map(({ label, value, wide }) => (
        <div key={label} className={wide ? "sm:col-span-2" : ""}>
          <dt className="text-xs font-medium text-stone-500">{label}</dt>
          <dd className="mt-1 text-sm break-words text-stone-900">{value || value === 0 ? value : <span className="text-stone-400">Not provided</span>}</dd>
        </div>
      ))}
    </dl>
  );
}
