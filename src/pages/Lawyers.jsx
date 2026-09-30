import { Link } from 'react-router-dom';
import { PiGavel, PiPlus } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminGetLawyers } from '../api/api';
import { getDisplayName } from '../utils/userUtils';
import { formatDate, toTimestamp } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { lawyerStatus } from '../utils/status';

const lawyerName = (lawyer) => (lawyer?.user ? getDisplayName(lawyer.user) : lawyer?.lawyerName || 'Unnamed lawyer');

const columns = [
  {
    key: 'name',
    header: 'Lawyer',
    sortValue: (lawyer) => lawyerName(lawyer).toLowerCase(),
    render: (lawyer) => (
      <div className="flex items-center gap-3">
        <Avatar name={lawyerName(lawyer)} src={lawyer.photoUrl || lawyer.user?.photoUrl} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-medium text-stone-900">{lawyerName(lawyer)}</p>
          <p className="truncate text-xs text-stone-500">{lawyer.user?.email || '—'}</p>
        </div>
      </div>
    ),
  },
  { key: 'scn', header: 'SCN', render: (lawyer) => <span className="tabular">{lawyer.supremeCourtNumber || '—'}</span> },
  { key: 'state', header: 'State', sortValue: (lawyer) => lawyer.state || '', render: (lawyer) => lawyer.state || '—', mobileHidden: true },
  {
    key: 'areas',
    header: 'Practice areas',
    mobileHidden: true,
    render: (lawyer) => {
      const areas = lawyer.practiceAreas || [];
      if (!areas.length) return <span className="text-stone-400">—</span>;
      return (
        <div className="flex max-w-xs flex-wrap gap-1">
          <Badge>{areas[0]}</Badge>
          {areas.length > 1 && <Badge tone="brand">+{areas.length - 1}</Badge>}
        </div>
      );
    },
  },
  {
    key: 'status',
    header: 'Status',
    sortValue: (lawyer) => lawyerStatus(lawyer).label,
    render: (lawyer) => {
      const status = lawyerStatus(lawyer);
      return <Badge tone={status.tone} dot>{status.label}</Badge>;
    },
  },
  { key: 'joined', header: 'Joined', sortValue: (lawyer) => toTimestamp(lawyer.time), render: (lawyer) => <span className="tabular text-stone-500">{formatDate(lawyer.time)}</span> },
];

const Lawyers = () => {
  const { data, loading, error, reload } = useAsync(adminGetLawyers);
  const addButton = (
    <Button as={Link} to="/admin/add-lawyer" icon={PiPlus}>
      Add lawyer
    </Button>
  );

  return (
    <>
      <PageHeader title="Lawyers" description="Lawyer profiles registered on Paralex." actions={addButton} />
      <DataTable
        columns={columns}
        rows={Array.isArray(data?.data) ? data.data : []}
        loading={loading}
        error={error}
        onRetry={reload}
        searchText={(lawyer) => `${lawyerName(lawyer)} ${lawyer.user?.email || ''} ${lawyer.supremeCourtNumber || ''} ${lawyer.state || ''}`}
        searchPlaceholder="Search by name, email, SCN or state"
        filters={[
          { label: 'All', value: 'all' },
          { label: 'Active', value: 'active', predicate: (lawyer) => lawyerStatus(lawyer).label === 'Active' },
          { label: 'Disabled', value: 'disabled', predicate: (lawyer) => lawyerStatus(lawyer).label === 'Disabled' },
          { label: 'Blocked', value: 'blocked', predicate: (lawyer) => lawyerStatus(lawyer).label === 'Blocked' },
        ]}
        initialSort={{ key: 'joined', dir: 'desc' }}
        rowHref={(lawyer) => `/admin/lawyer/${lawyer.user?.id || lawyer.userId}`}
        empty={{ icon: PiGavel, title: 'No lawyers yet', description: 'Add a lawyer, or wait for lawyers to register in the app.', action: addButton }}
      />
    </>
  );
};

export default Lawyers;
