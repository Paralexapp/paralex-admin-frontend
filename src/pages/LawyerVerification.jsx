import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { PiArrowSquareOut, PiCheck, PiSealCheck, PiX } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminDecideLawyer, adminGetLawyerVerifications } from '../api/api';
import { ADMIN_VERIFYLAWYER_URL } from '../utils/constants';
import { formatDate, toTimestamp } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Field, Textarea } from '../components/ui/Form';

const TABS = [
  { value: 'PENDING', label: 'To verify' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'REJECTED', label: 'Rejected' },
];

const tone = { PENDING: 'warning', VERIFIED: 'success', REJECTED: 'danger', NOT_SUBMITTED: 'neutral' };
const label = { PENDING: 'To verify', VERIFIED: 'Verified', REJECTED: 'Rejected', NOT_SUBMITTED: 'Not submitted' };

/**
 * Lawyers and bailiffs waiting for Paralex to check their Supreme Court (or court registration)
 * number. Verified providers are listed first in the app with a badge.
 */
export default function LawyerVerification() {
  const [tab, setTab] = useState('PENDING');
  const load = useCallback(() => adminGetLawyerVerifications(tab), [tab]);
  const { data, loading, error, reload } = useAsync(load, [tab]);
  const [deciding, setDeciding] = useState(null); // { row, approve }
  const [note, setNote] = useState('');
  const [working, setWorking] = useState(false);

  const open = (row, approve) => {
    setDeciding({ row, approve });
    setNote('');
  };

  const decide = async () => {
    const { row, approve } = deciding;
    if (!approve && !note.trim()) {
      toast.error('Say why, so they know what to fix.');
      return;
    }
    setWorking(true);
    try {
      await adminDecideLawyer(row.userId, approve, note.trim());
      toast.success(approve ? `${row.name} is verified and has been notified.` : `${row.name} was told why they weren't verified.`);
      setDeciding(null);
      reload();
    } catch (err) {
      toast.error(err.error || "We couldn't save that decision. Please try again.");
    } finally {
      setWorking(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortValue: (r) => (r.name || '').toLowerCase(),
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-stone-900">{r.name || 'Unnamed'}</p>
            <p className="truncate text-xs text-stone-500">{r.email || '—'}{r.phone ? ` · ${r.phone}` : ''}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      mobileHidden: true,
      render: (r) => <Badge tone={r.providerType === 'BAILIFF' ? 'brand' : 'neutral'}>{r.providerType === 'BAILIFF' ? 'Bailiff' : 'Lawyer'}</Badge>,
    },
    {
      key: 'scn',
      header: 'SCN / Reg. no.',
      render: (r) => (
        <div>
          <span className="tabular">{r.supremeCourtNumber || '—'}</span>
          {r.callToBarUrl && /^https:/i.test(r.callToBarUrl) && (
            <a href={r.callToBarUrl} target="_blank" rel="noopener noreferrer" className="mt-0.5 flex items-center gap-1 text-xs text-brand-700 hover:underline">
              {r.providerType === 'BAILIFF' ? 'ID document' : 'Call to Bar certificate'} <PiArrowSquareOut className="size-3" />
            </a>
          )}
          {r.yearCalledToBar ? <p className="text-xs text-stone-400">Called {r.yearCalledToBar}</p> : null}
        </div>
      ),
    },
    { key: 'state', header: 'State', mobileHidden: true, render: (r) => r.state || '—' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <div>
          <Badge tone={tone[r.verification] || 'neutral'} dot>{label[r.verification] || r.verification}</Badge>
          {r.note && <p className="mt-1 max-w-56 text-xs text-stone-500">{r.note}</p>}
        </div>
      ),
    },
    {
      key: 'when',
      header: tab === 'PENDING' ? 'Submitted' : 'Decided',
      mobileHidden: true,
      sortValue: (r) => toTimestamp(tab === 'PENDING' ? r.submittedAt : r.verifiedAt),
      render: (r) => <span className="tabular text-stone-500">{formatDate(tab === 'PENDING' ? r.submittedAt : r.verifiedAt) || '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex justify-end gap-2">
          {r.verification !== 'VERIFIED' && (
            <Button size="sm" icon={PiCheck} onClick={(e) => { e.stopPropagation(); open(r, true); }}>Verify</Button>
          )}
          {r.verification !== 'REJECTED' && (
            <Button size="sm" variant="secondary" icon={PiX} onClick={(e) => { e.stopPropagation(); open(r, false); }}>
              {r.verification === 'VERIFIED' ? 'Remove' : 'Reject'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const rows = Array.isArray(data) ? data : [];
  const row = deciding?.row;

  return (
    <>
      <PageHeader
        title="Lawyer verification"
        description="Check each Supreme Court number before a lawyer shows as verified in the app. Bailiffs appear here too."
        actions={
          <Button as="a" href={ADMIN_VERIFYLAWYER_URL} target="_blank" rel="noopener noreferrer" variant="secondary" icon={PiArrowSquareOut}>
            Check a number
          </Button>
        }
      />

      <div className="mb-4 flex gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${tab === t.value ? 'bg-brand-900 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        onRetry={reload}
        getRowKey={(r) => r.userId}
        searchText={(r) => `${r.name || ''} ${r.email || ''} ${r.phone || ''} ${r.supremeCourtNumber || ''}`}
        searchPlaceholder="Search by name, email or number"
        initialSort={{ key: 'when', dir: 'desc' }}
        empty={{
          icon: PiSealCheck,
          title: tab === 'PENDING' ? 'Nobody waiting' : tab === 'VERIFIED' ? 'No one verified yet' : 'No one rejected',
          description: tab === 'PENDING' ? 'New lawyers and bailiffs appear here when they submit their details.' : '',
        }}
      />

      <Modal
        open={!!deciding}
        onClose={() => !working && setDeciding(null)}
        title={deciding?.approve ? `Verify ${row?.name}?` : `${row?.verification === 'VERIFIED' ? 'Remove verification for' : 'Reject'} ${row?.name}?`}
        description={
          deciding?.approve
            ? `Only verify after checking ${row?.supremeCourtNumber || 'their number'}. They get a "You're verified" notification and show as verified in the app.`
            : 'They get a notification with your reason and can fix their details and submit again.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeciding(null)} disabled={working}>Cancel</Button>
            <Button variant={deciding?.approve ? 'primary' : 'danger'} onClick={decide} loading={working}>
              {deciding?.approve ? 'Verify' : row?.verification === 'VERIFIED' ? 'Remove verification' : 'Reject'}
            </Button>
          </>
        }
      >
        <Field label={deciding?.approve ? 'Note (optional)' : 'Reason (they will see this)'} htmlFor="decision-note">
          <Textarea
            id="decision-note"
            className="min-h-24"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={deciding?.approve ? 'e.g. Checked on the NBA portal' : 'e.g. The Supreme Court number does not match your name'}
          />
        </Field>
      </Modal>
    </>
  );
}
