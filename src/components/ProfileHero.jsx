import { Card } from './ui/Card';
import Avatar from './ui/Avatar';
import { Skeleton } from './ui/States';

/** ProfileHero - banner card at the top of every profile page */
export default function ProfileHero({ name, src, subtitle, badges, meta = [], actions, loading }) {
  return (
    <Card className="overflow-hidden">
      <div className="h-24 bg-brand-950 bg-[radial-gradient(ellipse_at_top_right,rgb(216_27_96/0.35),transparent_60%),radial-gradient(ellipse_at_bottom_left,rgb(127_58_132/0.6),transparent_60%)]" />
      <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="-mt-10 w-fit rounded-2xl bg-white p-1 shadow-card">
            {loading ? <Skeleton className="size-20 rounded-xl" /> : <Avatar name={name} src={src} size="xl" />}
          </div>
          <div className="min-w-0 pb-1">
            {loading ? (
              <>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="mt-2 h-4 w-32" />
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight text-stone-900">{name}</h1>
                  {badges}
                </div>
                {subtitle && <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>}
                {meta.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-600">
                    {meta.map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-center gap-1.5">
                        <Icon className="size-4 text-stone-400" />
                        {text}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </Card>
  );
}
