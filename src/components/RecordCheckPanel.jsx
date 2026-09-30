import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PiCheckCircle, PiClockCounterClockwise, PiMagnifyingGlass, PiWarning } from 'react-icons/pi';
import { RECORDS_DEMO, getRecordChecks, runRecordCheck, searchBims, searchLcis } from '../api/records';
import { extractList, personName, bimsTone } from '../utils/records';
import { formatDate } from '../utils/format';
import { Card, CardHeader } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';

// Demo builds (VITE_RECORDS_DEMO=1) search the sample records in the browser and save nothing
const runSearches = async (search, criteriaList, keyOf) => {
  const results = await Promise.allSettled(criteriaList.map((criteria) => search(criteria)));
  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length === results.length && results.length) throw failed[0].reason;
  const seen = new Map();
  results.forEach((r) => r.status === 'fulfilled' && extractList(r.value).forEach((item) => seen.set(keyOf(item), item)));
  return [...seen.values()];
};

const demoCheck = async (bond) => {
  const name = (bond.fullName || '').trim();
  const phone = (bond.phoneNumber || '').replace(/\s+/g, '');
  const nin = (bond.nin || '').trim();
  const [lcis, bims] = await Promise.all([
    runSearches(searchLcis, [name && { full_name: name }, phone && { phone_number: phone }].filter(Boolean), (r) => r.lcis_number),
    runSearches(searchBims, [name && { full_name: name }, phone && { phone_number: phone }, nin && { id_number: nin }].filter(Boolean), (r) => r.id),
  ]);
  return { lcis, bims, check: null };
};

const describeCheck = (check) => {
  const total = (check.lcisMatches?.length || 0) + (check.bimsMatches?.length || 0);
  return `${formatDate(check.checkedAt)} by ${check.checkedBy} · ${total ? `${total} possible match${total === 1 ? '' : 'es'}` : 'no records found'}`;
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
 * Pre-approval background check against LCIS (inmate records) and BIMS (bail records). The server
 * runs it with the applicant's own details and saves who checked, when and what matched, so the
 * record survives a refresh and serves as an audit trail. An admin still judges whether a match
 * is really the applicant (names aren't unique).
 */
export default function RecordCheckPanel({ bond, onChecked }) {
  const [state, setState] = useState({ status: 'idle', lcis: [], bims: [], error: null });
  const [history, setHistory] = useState([]);

  // A check saved earlier (by anyone) already satisfies the pre-approval requirement
  useEffect(() => {
    if (RECORDS_DEMO) return;
    getRecordChecks(bond.id)
      .then((list) => {
        const checks = Array.isArray(list) ? list : [];
        setHistory(checks);
        if (checks.length) onChecked?.({ saved: true });
      })
      .catch(() => setHistory([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per application
  }, [bond.id]);

  const run = async () => {
    setState({ status: 'running', lcis: [], bims: [], error: null });
    try {
      const result = RECORDS_DEMO ? await demoCheck(bond) : await runRecordCheck(bond.id);
      setState({ status: 'done', lcis: result.lcis || [], bims: result.bims || [], error: null });
      if (result.check) setHistory((prev) => [result.check, ...prev]);
      onChecked?.({ saved: Boolean(result.check) });
    } catch (err) {
      if (err?.status === 503) {
        // LCIS/BIMS aren't connected on the server yet: say so, and don't block approvals forever
        setState({ status: 'unavailable', lcis: [], bims: [], error: null });
        onChecked?.({ unavailable: true });
      } else {
        setState({ status: 'error', lcis: [], bims: [], error: typeof err?.error === 'string' ? err.error : "The record systems couldn't be reached." });
      }
    }
  };

  const total = state.lcis.length + state.bims.length;
  const last = history[0];

  return (
    <Card className="print:hidden">
      <CardHeader
        title="Background check (LCIS & BIMS)"
        description={RECORDS_DEMO ? 'Using sample records; checks are not saved.' : 'Searches the applicant’s name, phone and NIN. Each check is saved with who ran it.'}
        actions={
          <Button variant={state.status === 'done' || last ? 'secondary' : 'primary'} icon={PiMagnifyingGlass} onClick={run} loading={state.status === 'running'}>
            {state.status === 'done' || last ? 'Run again' : 'Check records'}
          </Button>
        }
      />
      <div className="space-y-5 p-5">
        {last && state.status !== 'done' && (
          <div className="flex gap-3 rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-700 ring-1 ring-stone-200 ring-inset">
            <PiClockCounterClockwise className="mt-0.5 size-5 shrink-0 text-stone-500" />
            <p>
              <span className="font-medium">Last checked</span> {describeCheck(last)}
            </p>
          </div>
        )}
        {state.status === 'idle' && !last && <p className="text-sm text-stone-500">Run the check before approving. Approve stays locked until you do.</p>}
        {state.status === 'unavailable' && (
          <div className="flex gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200 ring-inset">
            <PiWarning className="mt-0.5 size-5 shrink-0" />
            <p>
              <span className="font-medium">Background check unavailable.</span> LCIS and BIMS aren’t connected on the server yet, so this applicant couldn’t be checked.
              You can still approve, but no check will be on record.
            </p>
          </div>
        )}
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
        {history.length > 1 && (
          <details className="text-sm text-stone-600">
            <summary className="cursor-pointer font-medium text-stone-700">All checks ({history.length})</summary>
            <ul className="mt-2 space-y-1 pl-1">
              {history.map((check) => (
                <li key={check.id} className="text-stone-500">
                  {describeCheck(check)}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </Card>
  );
}
