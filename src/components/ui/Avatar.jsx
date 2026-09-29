import { getInitials } from "../../utils/format";

const sizes = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-16 text-xl", xl: "size-20 text-2xl" };

// Stable tint per person so a list of avatars isn't one flat colour
const tints = [
  "bg-brand-100 text-brand-800",
  "bg-amber-100 text-amber-800",
  "bg-emerald-100 text-emerald-800",
  "bg-sky-100 text-sky-800",
  "bg-rose-100 text-rose-800",
  "bg-stone-200 text-stone-700",
];

const tintFor = (name = "") => tints[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % tints.length];

/** Avatar - photo if present, otherwise initials in a rounded square */
export default function Avatar({ name, src, size = "md", className = "" }) {
  const base = `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl font-semibold ${sizes[size]} ${className}`;
  if (src) return <img src={src} alt={name ? `${name}'s photo` : "Profile photo"} className={`${base} object-cover`} />;
  return (
    <span className={`${base} ${tintFor(name)}`} aria-hidden="true">
      {getInitials(name)}
    </span>
  );
}
