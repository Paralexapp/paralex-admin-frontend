import { useSearchParams } from 'react-router-dom';
import { PiIdentificationCard, PiMagnifyingGlass } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { RECORDS_DEMO, searchLcis } from '../api/records';
import { extractList, extractTotal, lcisCourt, personName, present } from '../utils/records';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Avatar from '../components/ui/Avatar';
import { Card } from '../components/ui/Card';
import { EmptyState, SampleDataNotice } from '../components/ui/States';
import RecordSearchForm from '../components/RecordSearchForm';

const LCIS_FIELDS = [
  { name: 'full_name', label: 'Full name', placeholder: 'e.g. Tunde Adewale' },
  { name: 'phone_number', label: 'Phone number', placeholder: 'e.g. 0803…' },
  { name: 'lcis_number', label: 'LCIS number', placeholder: 'e.g. LCIS/0926/…' },
  { name: 'address', label: 'Address', placeholder: 'Street or area' },
  { name: 'offense', label: 'Offence', placeholder: 'e.g. Theft' },
];

const columns = [
  {
    key: 'name',
    header: 'Inmate',
    sortValue: (r) => personName(r).toLowerCase(),
    render: (r) => (
      <div className="flex items-center gap-3">
        <Avatar name={personName(r)} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-medium text-stone-900">{personName(r)}</p>
          <p className="tabular truncate text-xs text-stone-500">{r.lcis_number || '—'}</p>
        </div>
      </div>
    ),
  },
  { key: 'offense', header: 'Offence', sortValue: (r) => r.Offence || '', render: (r) => (present(r.Offence) ? r.Offence : '—') },
  { key: 'arrested', header: 'Arrested', sortValue: (r) => r.Date_Defendant_Arrested || '', render: (r) => <span className="tabular">{present(r.Date_Defendant_Arrested) ? r.Date_Defendant_Arrested : '—'}</span>, mobileHidden: true },
  { key: 'court', header: 'Court', render: (r) => lcisCourt(r) || '—', mobileHidden: true },
  { key: 'prison', header: 'Custodial centre', render: (r) => (present(r.Prison_name) ? r.Prison_name : <span className="text-stone-400">Not recorded</span>) },
];

/** Criteria live in the URL so Back from a record returns to the same results */
const readCriteria = (params) => Object.fromEntries(LCIS_FIELDS.map((f) => [f.name, params.get(f.name)]).filter(([, v]) => v));

const LcisSearch = () => {
  const [params, setParams] = useSearchParams();
  const criteria = readCriteria(params);
  const hasSearch = Object.keys(criteria).length > 0;
  const key = params.toString();
  const { data, loading, error, reload } = useAsync(() => (hasSearch ? searchLcis(criteria) : Promise.resolve(null)), [key]);
  const rows = extractList(data);

  return (
    <>
      <PageHeader title="LCIS inmate records" description="Search the Lagos custodial (inmate) records before standing surety for an applicant." />
      {RECORDS_DEMO && <SampleDataNotice>LCIS isn't connected yet. These are made-up sample records so the screens can be reviewed.</SampleDataNotice>}
      <RecordSearchForm key={key} fields={LCIS_FIELDS} initial={criteria} loading={loading && hasSearch} onSearch={(c) => setParams(c)} />
      {hasSearch ? (
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          onRetry={reload}
          getRowKey={(r, i) => r.lcis_number || i}
          rowHref={(r) => `/admin/lcis/record?lcis=${encodeURIComponent(r.lcis_number)}&from=${encodeURIComponent(key)}`}
          toolbar={!loading && data ? <span className="text-sm text-stone-500">{extractTotal(data, rows.length)} match(es)</span> : null}
          empty={{ icon: PiIdentificationCard, title: 'No inmate records found', description: 'Nobody in LCIS matches every field you searched.' }}
        />
      ) : (
        <Card>
          <EmptyState icon={PiMagnifyingGlass} title="Search to see inmate records" description="Enter a name, phone number, LCIS number, address or offence above." />
        </Card>
      )}
    </>
  );
};

export default LcisSearch;
