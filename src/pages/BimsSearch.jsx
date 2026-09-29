import { useSearchParams } from 'react-router-dom';
import { PiFolderOpen, PiMagnifyingGlass } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { RECORDS_DEMO, searchBims } from '../api/records';
import { extractList, extractTotal, personName, bimsTone, present } from '../utils/records';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { EmptyState, SampleDataNotice } from '../components/ui/States';
import RecordSearchForm from '../components/RecordSearchForm';

const BIMS_FIELDS = [
  { name: 'full_name', label: 'Defendant name', placeholder: 'e.g. Chidi Nwosu' },
  { name: 'phone_number', label: 'Phone number', placeholder: 'Defendant or surety' },
  { name: 'id_number', label: 'Surety ID number', placeholder: 'NIN or BVN' },
  { name: 'address', label: 'Address', placeholder: 'Street or area' },
  { name: 'offense', label: 'Offence', placeholder: 'e.g. Assault' },
  { name: 'bail_status', label: 'Bail status', options: ['Pending', 'Approved', 'Rejected'] },
];

const columns = [
  {
    key: 'defendant',
    header: 'Defendant',
    sortValue: (r) => personName(r).toLowerCase(),
    render: (r) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-stone-900">{personName(r)}</p>
        <p className="tabular truncate text-xs text-stone-500">{r.uuid || r.id}</p>
      </div>
    ),
  },
  { key: 'offense', header: 'Offence', sortValue: (r) => r.defendant_offense || '', render: (r) => r.defendant_offense || '—' },
  { key: 'court', header: 'Court', render: (r) => (present(r.defendant_court_magname) ? r.defendant_court_magname : r.court || '—'), mobileHidden: true },
  { key: 'surety', header: 'Surety', render: (r) => (present(r.surety_full_name) ? r.surety_full_name : <span className="text-stone-400">None listed</span>), mobileHidden: true },
  { key: 'custody', header: 'Defendant status', render: (r) => (r.defendant_status ? <Badge tone={bimsTone(r.defendant_status)}>{r.defendant_status}</Badge> : '—') },
  { key: 'bail', header: 'Bail status', sortValue: (r) => r.status || '', render: (r) => (r.status ? <Badge tone={bimsTone(r.status)} dot>{r.status}</Badge> : '—') },
];

const readCriteria = (params) => Object.fromEntries(BIMS_FIELDS.map((f) => [f.name, params.get(f.name)]).filter(([, v]) => v));

const BimsSearch = () => {
  const [params, setParams] = useSearchParams();
  const criteria = readCriteria(params);
  const hasSearch = Object.keys(criteria).length > 0;
  const key = params.toString();
  const { data, loading, error, reload } = useAsync(() => (hasSearch ? searchBims(criteria) : Promise.resolve(null)), [key]);
  const rows = extractList(data);

  return (
    <>
      <PageHeader title="BIMS bail records" description="Search existing bail records, for example to see whether an applicant is already on bail or a surety has stood for others." />
      {RECORDS_DEMO && <SampleDataNotice>BIMS isn't connected yet. These are made-up sample records so the screens can be reviewed.</SampleDataNotice>}
      <RecordSearchForm key={key} fields={BIMS_FIELDS} initial={criteria} loading={loading && hasSearch} onSearch={(c) => setParams(c)} />
      {hasSearch ? (
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          onRetry={reload}
          getRowKey={(r, i) => r.id || i}
          rowHref={(r) => `/admin/bims/${encodeURIComponent(r.id)}?from=${encodeURIComponent(key)}`}
          toolbar={!loading && data ? <span className="text-sm text-stone-500">{extractTotal(data, rows.length)} match(es)</span> : null}
          empty={{ icon: PiFolderOpen, title: 'No bail records found', description: 'Nothing in BIMS matches every field you searched.' }}
        />
      ) : (
        <Card>
          <EmptyState icon={PiMagnifyingGlass} title="Search to see bail records" description="Enter a defendant name, phone number, surety ID number, address or offence above." />
        </Card>
      )}
    </>
  );
};

export default BimsSearch;
