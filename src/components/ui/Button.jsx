import { PiSpinnerGap } from "react-icons/pi";

const variants = {
  primary: "bg-brand-900 text-white hover:bg-brand-800 shadow-sm",
  secondary: "bg-white text-stone-700 ring-1 ring-inset ring-stone-200 hover:bg-stone-50 hover:text-stone-900",
  ghost: "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
  danger: "bg-accent-500 text-white hover:bg-accent-600 shadow-sm",
  "danger-ghost": "text-accent-600 hover:bg-accent-500/10",
};

const sizes = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-5 text-sm gap-2 rounded-xl",
  icon: "h-9 w-9 rounded-lg justify-center",
};

/** Button - the one button style for the app. `as` lets it render a Link or anchor. */
export default function Button({
  as: Component = "button",
  variant = "primary",
  size = "md",
  loading = false,
  icon: Icon,
  className = "",
  children,
  disabled,
  ...props
}) {
  const isButton = Component === "button";
  return (
    <Component
      className={`inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isButton ? disabled || loading : undefined}
      aria-disabled={!isButton && disabled ? true : undefined}
      {...(isButton && !props.type ? { type: "button" } : {})}
      {...props}
    >
      {loading ? <PiSpinnerGap className="size-4 animate-spin" /> : Icon ? <Icon className="size-4" /> : null}
      {children}
    </Component>
  );
}
