import { PiCheck } from "react-icons/pi";

/** ChipSelect - pick several options by toggling chips (replaces the native multi-select) */
export default function ChipSelect({ options, value = [], onChange, error }) {
  const toggle = (option) =>
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);

  return (
    <div className={`flex flex-wrap gap-2 rounded-xl p-3 ring-1 ring-inset ${error ? "ring-accent-500" : "ring-stone-200"}`}>
      {options.map((option) => {
        const selected = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(option)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition active:scale-[0.97] ${
              selected
                ? "bg-brand-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900"
            }`}
          >
            {selected && <PiCheck className="size-3.5" />}
            {option}
          </button>
        );
      })}
    </div>
  );
}
