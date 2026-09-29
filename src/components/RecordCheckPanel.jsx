import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PiCheckCircle, PiMagnifyingGlass, PiWarning } from 'react-icons/pi';
import { RECORDS_DEMO, searchBims, searchLcis } from '../api/records';
import { extractList, personName, bimsTone } from '../utils/records';
import { Card, CardHeader } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';

// Each search ANDs its criteria, so run name, phone and ID separately and merge the hits.
const runSearches = async (search, criteriaList, keyOf) => {
  const results = await Promise.allSettled(criteriaList.map((criteria) => search(criteria)));
  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length === results.length && results.length) throw failed[0].reason;
  const seen = new Map();
  results.forEach((r) => r.status === 'fulfilled' && extractList(r.value).forEach((item) => seen.set(keyOf(item), item)));
  return [...seen.values()];
};

function MatchList({ title, items, empty, hrefOf, describe }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium tracking-wide text-stone-500 uppercase">{title}</p>
      {items.length ? (
        <ul className="divide-y divide-stone-100 rounded-xl ring-1 ring-stone-200">
          {items.map((item, i) => (
            <li key={i}>
              <Link to={hrefOf(item)} className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-stone-50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-900">{personName(item)}</p>
                  <p className="truncate text-xs text-stone-500">{describe(item)}</p>
                </div>
                {(item.status || item.defendant_status) && (
                  <Badge tone={bimsTone(item.status || item.defendant_status)}>{item.status || item.defendant_status}</Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-500">{empty}</p>
      )}
    </div>
  );
}

/**
 * Background check for a bail bond applicant against LCIS (inmate records) and BIMS (bail
 * records), run before Paralex agrees to stand as surety. It shows possible matches; an admin
 * decides whether a match is really the applicant (names are not unique).
 */
export default function RecordCheckPanel({ bond, onChecked }) {
  const [state, setState] = useState({ status: 'idle', lcis: [], bims: [], error: null });

  const name = (bond.fullName || '').trim();
  const phone = (bond.phoneNumber || '').replace(/\s+/g, '');
  const nin = (bond.nin || '').trim();

  const run = async () => {
    setState({ status: 'running', lcis: [], bims: [], error: null });
    try {
      const [lcis, bims] = await Promise.all([
        runSearches(searchLcis, [name && { full_name: name }, phone && { phone_number: phone }].filter(Boolean), (r) => r.lcis_number || JSON.stringify(r)),
        runSearches(
          searchBims,
          [name && { full_name: name }, phone && { phone_number: phone }, nin && { id_number: nin }].filter(Boolean),
          (r) => r.id || JSON.stringify(r)
        ),
      ]);
      setState({ status: 'done', lcis, bims, error: null });
      onChecked?.({ matches: lcis.length + bims.length });
    } catch (err) {
      setState({ status: 'error', lcis: [], bims: [], error: err?.error || "The record systems couldn't be reached." });
    }
  };

  const total = state.lcis.length + state.bims.length;

  return (
    <Card className="print:hidden">
      <CardHeader
        title="Background check (LCIS & BIMS)"
        description={`Searches by ${[name && 'name', phone && 'phone', nin && 'NIN'].filter(Boolean).join(', ') || 'no details'} before Paralex stands as surety.${RECORDS_DEMO ? ' Using sample records.' : ''}`}
        actions={
          <Button variant={state.status === 'done' ? 'secondary' : 'primary'} icon={PiMagnifyingGlass} onClick={run} loading={state.status === 'running'} disabled={!name && !phone && !nin}>
            {state.status === 'done' ? 'Run again' : 'Check records'}
          </Button>
        }
      />
      <div className="space-y-5 p-5">
        {state.status === 'idle' && <p className="text-sm text-stone-500">Run the check before approving. Approve stays locked until you do.</p>}
        {state.status === 'error' && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>}
        {state.status === 'done' &&
          (total ? (
            <div className="flex gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200 ring-inset">
              <PiWarning className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-medium">
                  {total} possible match{total === 1 ? '' : 'es'} found
                </p>
                <p className="mt-0.5 opacity-80">Open each one and confirm whether it's really this applicant. Different people can share a name.</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200 ring-inset">
              <PiCheckCircle className="mt-0.5 size-5 shrink-0" />
              <p>
                <span className="font-medium">No records found</span> in LCIS or BIMS for this applicant's name, phone or NIN.
              </p>
            </div>
          ))}
        {state.status === 'done' && total > 0 && (
          <div className="grid gap-5 lg:grid-cols-2">
            <MatchList
              title="LCIS inmate records"
              items={state.lcis}
              empty="No inmate records."
              hrefOf={(r) => `/admin/lcis/record?lcis=${encodeURIComponent(r.lcis_number)}`}
              describe={(r) => [r.lcis_number, r.Offence].filter(Boolean).join(' · ')}
            />
            <MatchList
              title="BIMS bail records"
              items={state.bims}
              empty="No bail records."
              hrefOf={(r) => `/admin/bims/${encodeURIComponent(r.id)}`}
              describe={(r) => [r.uuid, r.defendant_offense].filter(Boolean).join(' · ')}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
