import { Link } from 'react-router-dom';
import { PiPlus, PiUsers } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminGetUsers } from '../api/api';
import { getDisplayName } from '../utils/userUtils';
import { formatDate, humanize, toTimestamp } from '../utils/format';
import { accountStatus } from '../utils/status';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const columns = [
  {
    key: 'name',
    header: 'User',
    sortValue: (user) => getDisplayName(user).toLowerCase(),
    render: (user) => (
      <div className="flex items-center gap-3">
        <Avatar name={getDisplayName(user)} src={user.photoUrl} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-medium text-stone-900">{getDisplayName(user)}</p>
          <p className="truncate text-xs text-stone-500">{user.email}</p>
        </div>
      </div>
    ),
  },
  { key: 'phone', header: 'Phone', render: (user) => <span className="tabular">{user.phoneNumber || '—'}</span>, mobileHidden: true },
  { key: 'role', header: 'Role', sortValue: (user) => user.userType || '', render: (user) => <Badge tone="brand">{humanize(user.userType)}</Badge> },
  {
    key: 'status',
    header: 'Status',
    sortValue: (user) => accountStatus(user).label,
    render: (user) => {
      const status = accountStatus(user);
      return <Badge tone={status.tone} dot>{status.label}</Badge>;
    },
  },
  { key: 'joined', header: 'Joined', sortValue: (user) => toTimestamp(user.time), render: (user) => <span className="tabular text-stone-500">{formatDate(user.time)}</span> },
];

const Users = () => {
  const { data, loading, error, reload } = useAsync(adminGetUsers);

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone who has signed up in the Paralex app."
        actions={
          <Button as={Link} to="/admin/add-user" icon={PiPlus}>
            Add user
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={Array.isArray(data) ? data : []}
        loading={loading}
        error={error}
        onRetry={reload}
        searchText={(user) => `${getDisplayName(user)} ${user.email || ''} ${user.phoneNumber || ''}`}
        searchPlaceholder="Search by name, email or phone"
        filters={[
          { label: 'All', value: 'all' },
          { label: 'Active', value: 'active', predicate: (user) => accountStatus(user).label === 'Active' },
          { label: 'Blocked', value: 'blocked', predicate: (user) => accountStatus(user).label === 'Blocked' },
        ]}
        initialSort={{ key: 'joined', dir: 'desc' }}
        rowHref={(user) => `/admin/user/${user.id}`}
        empty={{ icon: PiUsers, title: 'No users yet', description: 'People who sign up in the app will appear here.' }}
      />
    </>
  );
};

export default Users;
