import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PiArrowClockwise, PiMapPin, PiMotorcycle, PiPhone } from 'react-icons/pi';
import { adminGetOnlineRiders } from '../api/api';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';

const REFRESH_MS = 30 * 1000;

const STATES = {
  ACTIVE: { label: 'Active now', tone: 'success', hint: 'App sent a location in the last 5 minutes.' },
  QUIET: { label: 'Quiet', tone: 'warning', hint: 'Switched on, last heard from 5–30 minutes ago.' },
  SILENT: { label: 'Silent', tone: 'danger', hint: 'Switched on, but nothing for over 30 minutes. Gets no jobs until the app reports again.' },
  OFFLINE: { label: 'Offline', tone: 'neutral', hint: 'Switched off; was online in the last 24 hours.' },
};

const FILTERS = [
  { key: 'ON', label: 'Switched on' },
  { key: 'ACTIVE', label: 'Active now' },
  { key: 'SILENT', label: 'Switched on but silent' },
  { key: 'ALL', label: 'Last 24 hours' },
];

const ago = (s) => {
  if (s == null) return 'Never';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} min ago`;
  return `${Math.floor(s / 86400)} days ago`;
};

const hasPosition = (r) => Number.isFinite(r?.latitude) && Number.isFinite(r?.longitude);

const mapEmbed = (r) => {
  const d = 0.01;
  const bbox = [r.longitude - d, r.latitude - d, r.longitude + d, r.latitude + d].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${r.latitude},${r.longitude}`;
};

const googleMaps = (r) => `https://www.google.com/maps?q=${r.latitude},${r.longitude}`;

const jobLabel = (r) =>
  r.jobStage === 'TO_PICKUP' ? 'Going to pickup' : r.jobStage === 'DELIVERING' ? 'Delivering' : null;

/**
 * Who is really online: the Online switch alone isn't enough, because a phone that was closed or
 * lost signal keeps the switch on. The app sends its location about every 30 seconds while online.
 */
export default function OnlineRiders() {
  const [riders, setRiders] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ON');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminGetOnlineRiders();
      setRiders(Array.isArray(list) ? list : []);
      setError(null);
    } catch (err) {
      setError(err?.error || "We couldn't load riders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const counts = useMemo(() => {
    const c = { ACTIVE: 0, QUIET: 0, SILENT: 0, OFFLINE: 0, onJob: 0 };
    (riders || []).forEach((r) => {
      c[r.state] = (c[r.state] || 0) + 1;
      if (r.jobOrderId) c.onJob += 1;
    });
    return c;
  }, [riders]);

  const shown = useMemo(() => {
    const list = riders || [];
    if (filter === 'ON') return list.filter((r) => r.switchedOn);
    if (filter === 'ACTIVE') return list.filter((r) => r.state === 'ACTIVE');
    if (filter === 'SILENT') return list.filter((r) => r.state === 'SILENT' || r.state === 'QUIET');
    return list;
  }, [riders, filter]);

  const current = useMemo(() => {
    const list = riders || [];
    return list.find((r) => r.riderId === selected) || shown.find(hasPosition) || null;
  }, [riders, shown, selected]);

  const tiles = [
    { label: 'Active now', value: counts.ACTIVE, tone: 'text-emerald-700' },
    { label: 'Quiet (5–30 min)', value: counts.QUIET, tone: 'text-amber-700' },
    { label: 'Switched on but silent', value: counts.SILENT, tone: 'text-rose-700' },
    { label: 'On a delivery', value: counts.onJob, tone: 'text-brand-800' },
  ];

  return (
    <>
      <PageHeader
        title="Online riders"
        description="Who is really online right now. Refreshes every 30 seconds."
        actions={
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
            <PiArrowClockwise className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-5">
            <p className="text-sm font-medium text-stone-500">{t.label}</p>
            {riders == null ? (
              <Skeleton className="mt-3 h-8 w-12" />
            ) : (
              <p className={`mt-2 text-3xl font-semibold ${t.tone}`}>{t.value}</p>
            )}
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader
            title="Riders"
            description="Tap a rider to see them on the map."
            actions={
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition ${
                      filter === f.key ? 'bg-brand-900 text-white ring-brand-900' : 'bg-white text-stone-600 ring-stone-200 hover:ring-brand-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            }
          />
          {error && riders == null ? (
            <ErrorState message={error} onRetry={load} />
          ) : riders == null ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <EmptyState icon={PiMotorcycle} title="No riders here" description="Nobody matches this filter right now." />
          ) : (
            <ul className="divide-y divide-stone-100">
              {shown.map((r) => {
                const st = STATES[r.state] || STATES.OFFLINE;
                const job = jobLabel(r);
                const isCurrent = current?.riderId === r.riderId;
                return (
                  <li
                    key={r.riderId}
                    onClick={() => hasPosition(r) && setSelected(r.riderId)}
                    className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition ${
                      hasPosition(r) ? 'cursor-pointer hover:bg-stone-50' : ''
                    } ${isCurrent ? 'bg-brand-50/60' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {r.profileId ? (
                          <Link
                            to={`/admin/driver/${encodeURIComponent(r.profileId)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="truncate text-sm font-semibold text-stone-900 hover:text-brand-800 hover:underline"
                          >
                            {r.name || 'Unnamed rider'}
                          </Link>
                        ) : (
                          <span className="truncate text-sm font-semibold text-stone-900">{r.name || 'Unnamed rider'}</span>
                        )}
                        <span title={st.hint}>
                          <Badge tone={st.tone} dot>
                            {st.label}
                          </Badge>
                        </span>
                        {job && <Badge tone="brand">{job}{r.jobTrackingId ? ` · ${r.jobTrackingId}` : ''}</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs text-stone-500">
                        Last seen {ago(r.secondsAgo)}
                        {r.vehicleType ? ` · ${r.vehicleType.toLowerCase()}` : ''}
                        {r.platform ? ` · ${r.platform === 'ios' ? 'iPhone' : 'Android'}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.phone && (
                        <a
                          href={`tel:${r.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-stone-600 ring-1 ring-stone-200 hover:text-brand-800"
                        >
                          <PiPhone className="size-3.5" />
                          {r.phone}
                        </a>
                      )}
                      {hasPosition(r) && (
                        <a
                          href={googleMaps(r)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-stone-600 ring-1 ring-stone-200 hover:text-brand-800"
                        >
                          <PiMapPin className="size-3.5" />
                          Map
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader
            title={current ? current.name || 'Rider' : 'Map'}
            description={current ? `Last location, ${ago(current.secondsAgo)}` : 'Pick a rider with a location.'}
          />
          {current && hasPosition(current) ? (
            <iframe
              key={`${current.riderId}-${current.latitude}-${current.longitude}`}
              title="Rider location"
              src={mapEmbed(current)}
              className="h-[420px] w-full border-0"
              loading="lazy"
            />
          ) : (
            <EmptyState icon={PiMapPin} title="No location yet" description="Riders appear here once their app has sent a location." />
          )}
        </Card>
      </div>

      <p className="mt-6 text-xs text-stone-500">
        <strong>Silent</strong> riders left their switch on, but their phone stopped reporting: the app was closed, mobile data is off,
        or they're on an app version older than 2.1.9. Call them to open the app or update it.
      </p>
    </>
  );
}
