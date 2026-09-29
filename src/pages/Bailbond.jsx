import { PiScales } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminGetBailBonds } from '../api/api';
import { formatDate, formatNaira, toTimestamp } from '../utils/format';
import { bailBondStatus, statusTone } from '../utils/status';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';

const columns = [
  {
    key: 'submitter',
    header: 'Submitter',
    sortValue: (bond) => (bond.fullName || '').toLowerCase(),
    render: (bond) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-stone-900">{bond.fullName || 'Unnamed submitter'}</p>
        <p className="tabular truncate text-xs text-stone-500">#{String(bond.id || '').slice(-8)}</p>
      </div>
    ),
  },
  { key: 'arrested', header: 'Arrest date', sortValue: (bond) => toTimestamp(bond.dateOfCurrentArrest), render: (bond) => <span className="tabular">{formatDate(bond.dateOfCurrentArrest)}</span> },
  { key: 'agency', header: 'Arresting agency', render: (bond) => bond.arrestingAgency || '—', mobileHidden: true },
  { key: 'amount', header: 'Amount', sortValue: (bond) => Number(bond.totalAmount) || 0, className: 'text-right', render: (bond) => <span className="tabular font-medium text-stone-900">{formatNaira(bond.totalAmount)}</span> },
  { key: 'paid', header: 'Payment', render: (bond) => (bond.paid ? <Badge tone="success">Paid</Badge> : <Badge>Unpaid</Badge>), mobileHidden: true },
  {
    key: 'status',
    header: 'Status',
    sortValue: (bond) => bailBondStatus(bond),
    render: (bond) => {
      const status = bailBondStatus(bond);
      return <Badge tone={statusTone[status]} dot>{status}</Badge>;
    },
  },
];

const byStatus = (status) => (bond) => bailBondStatus(bond) === status;

const Bailbond = () => {
  const { data, loading, error, reload } = useAsync(adminGetBailBonds);

  return (
    <>
      <PageHeader title="Bail bonds" description="Bail bond requests submitted through the app, newest first." />
      <DataTable
        columns={columns}
        rows={Array.isArray(data) ? data : []}
        loading={loading}
        error={error}
        onRetry={reload}
        searchText={(bond) => `${bond.fullName || ''} ${bond.id || ''} ${bond.arrestingAgency || ''}`}
        searchPlaceholder="Search by name, ID or agency"
        filters={[
          { label: 'All', value: 'all' },
          { label: 'Pending', value: 'Pending', predicate: byStatus('Pending') },
          { label: 'Approved', value: 'Approved', predicate: byStatus('Approved') },
          { label: 'Rejected', value: 'Rejected', predicate: byStatus('Rejected') },
          { label: 'Withdrawn', value: 'Withdrawn', predicate: byStatus('Withdrawn') },
        ]}
        initialSort={{ key: 'arrested', dir: 'desc' }}
        rowHref={(bond) => `/admin/bailbond/${encodeURIComponent(bond.id)}`}
        empty={{ icon: PiScales, title: 'No bail bond requests yet', description: 'Requests submitted in the app will appear here.' }}
      />
    </>
  );
};

export default Bailbond;
