import { Link } from 'react-router-dom';
import { PiPlus, PiSteeringWheel, PiStarFill } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminGetDrivers } from '../api/api';
import { formatDate, toTimestamp } from '../utils/format';
import { driverName, driverStatus } from '../utils/drivers';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const columns = [
  {
    key: 'name',
    header: 'Driver',
    sortValue: (driver) => driverName(driver).toLowerCase(),
    render: (driver) => (
      <div className="flex items-center gap-3">
        <Avatar name={driverName(driver)} src={driver.passportUrl || driver.user?.photoUrl} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-medium text-stone-900">{driverName(driver)}</p>
          <p className="truncate text-xs text-stone-500">{driver.user?.email || '—'}</p>
        </div>
      </div>
    ),
  },
  { key: 'phone', header: 'Phone', render: (driver) => <span className="tabular">{driver.user?.phoneNumber || '—'}</span>, mobileHidden: true },
  { key: 'bike', header: 'Bike', render: (driver) => (driver.hasBike ? <Badge tone="brand">{driver.bikeType || 'Yes'}</Badge> : <Badge>No bike</Badge>) },
  {
    key: 'rating',
    header: 'Rating',
    sortValue: (driver) => Number(driver.averageRating) || 0,
    mobileHidden: true,
    render: (driver) =>
      driver.totalReviews ? (
        <span className="tabular inline-flex items-center gap-1">
          <PiStarFill className="size-3.5 text-amber-500" />
          {Number(driver.averageRating).toFixed(1)}
          <span className="text-xs text-stone-400">({driver.totalReviews})</span>
        </span>
      ) : (
        <span className="text-stone-400">No reviews</span>
      ),
  },
  {
    key: 'status',
    header: 'Status',
    sortValue: (driver) => driverStatus(driver).label,
    render: (driver) => {
      const status = driverStatus(driver);
      return <Badge tone={status.tone} dot>{status.label}</Badge>;
    },
  },
  { key: 'joined', header: 'Joined', sortValue: (driver) => toTimestamp(driver.time), render: (driver) => <span className="tabular text-stone-500">{formatDate(driver.time)}</span> },
];

const byStatus = (label) => (driver) => driverStatus(driver).label === label;

const Drivers = () => {
  const { data, loading, error, reload } = useAsync(adminGetDrivers);

  return (
    <>
      <PageHeader
        title="Drivers"
        description="Riders registered to handle Paralex deliveries."
        actions={
          <Button as={Link} to="/admin/add-driver" icon={PiPlus} variant="secondary">
            Add driver
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={Array.isArray(data) ? data : []}
        loading={loading}
        error={error}
        onRetry={reload}
        searchText={(driver) => `${driverName(driver)} ${driver.user?.email || ''} ${driver.user?.phoneNumber || ''} ${driver.bikeType || ''}`}
        searchPlaceholder="Search by name, email or phone"
        filters={[
          { label: 'All', value: 'all' },
          { label: 'Available', value: 'Available', predicate: byStatus('Available') },
          { label: 'Offline', value: 'Offline', predicate: byStatus('Offline') },
          { label: 'Disabled', value: 'Disabled', predicate: byStatus('Disabled') },
        ]}
        initialSort={{ key: 'joined', dir: 'desc' }}
        rowHref={(driver) => `/admin/driver/${encodeURIComponent(driver.id)}`}
        empty={{ icon: PiSteeringWheel, title: 'No drivers yet', description: 'Riders who register in the app will appear here.' }}
      />
    </>
  );
};

export default Drivers;
