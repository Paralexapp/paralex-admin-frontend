import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PiEnvelopeSimple, PiPhone, PiProhibit, PiTrash, PiLockOpen, PiPencilSimple } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminBlockUser, adminDeleteUser, adminGetUserByUserId, adminGetUsers, adminUnblockUser } from '../api/api';
import { getDisplayName } from '../utils/userUtils';
import { formatDate, humanize } from '../utils/format';
import { accountStatus } from '../utils/status';
import PageHeader from '../components/ui/PageHeader';
import ProfileHero from '../components/ProfileHero';
import { Card, CardHeader } from '../components/ui/Card';
import DetailList from '../components/ui/DetailList';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { ErrorState, Skeleton } from '../components/ui/States';
import { ConfirmDialog } from '../components/ui/Modal';
import EditUserModal from '../components/EditUserModal';

// The single-user endpoint doesn't say whether the account is blocked; the list does.
const loadUser = async (userId) => {
  const [profile, list] = await Promise.all([adminGetUserByUserId(userId), adminGetUsers().catch(() => [])]);
  const fromList = (Array.isArray(list) ? list : []).find((u) => u.id === userId);
  return profile ? { ...profile, accountBlocked: fromList?.accountBlocked, enabled: fromList?.enabled } : profile;
};

const UserProfile = () => {
  const { userId } = useParams();
  const { data: user, loading, error, reload } = useAsync(() => loadUser(userId), [userId]);
  const status = accountStatus(user);
  const back = { to: '/admin/users', label: 'All users' };
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(null); // "block" | "unblock" | "delete"
  const [working, setWorking] = useState(false);
  const [editing, setEditing] = useState(false);

  const act = async () => {
    setWorking(true);
    try {
      if (confirm === 'block' || confirm === 'unblock') {
        await (confirm === 'block' ? adminBlockUser(userId) : adminUnblockUser(userId));
        toast.success(confirm === 'block' ? 'User blocked.' : 'User unblocked.');
        setConfirm(null);
        reload();
      } else {
        await adminDeleteUser(userId);
        toast.success('User deleted.');
        navigate('/admin/users', { replace: true });
      }
    } catch (err) {
      toast.error(typeof err.error === 'string' ? err.error : `We couldn't ${confirm} this user. Please try again.`);
    } finally {
      setWorking(false);
    }
  };

  if (error) {
    return (
      <>
        <PageHeader title="User profile" back={back} />
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      </>
    );
  }

  const name = getDisplayName(user);

  return (
    <>
      <PageHeader title="User profile" back={back} />
      <div className="space-y-6">
        <ProfileHero
          loading={loading}
          name={name}
          src={user?.photoUrl}
          subtitle={humanize(user?.userType)}
          badges={<Badge tone={status.tone} dot>{status.label}</Badge>}
          meta={[
            user?.email && { icon: PiEnvelopeSimple, text: user.email },
            user?.phoneNumber && { icon: PiPhone, text: user.phoneNumber },
          ].filter(Boolean)}
          actions={
            <>
              <Button variant="secondary" icon={PiPencilSimple} onClick={() => setEditing(true)} disabled={loading}>
                Edit details
              </Button>
              {user?.accountBlocked ? (
                <Button variant="secondary" icon={PiLockOpen} onClick={() => setConfirm('unblock')} disabled={loading}>
                  Unblock
                </Button>
              ) : (
                <Button variant="secondary" icon={PiProhibit} onClick={() => setConfirm('block')} disabled={loading}>
                  Block
                </Button>
              )}
              <Button variant="danger-ghost" icon={PiTrash} onClick={() => setConfirm('delete')} disabled={loading}>
                Delete
              </Button>
            </>
          }
        />

        <Card>
          <CardHeader title="Details" />
          <div className="p-6">
            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-9" />
                ))}
              </div>
            ) : (
              <DetailList
                items={[
                  { label: 'First name', value: user?.firstName },
                  { label: 'Last name', value: user?.lastName },
                  { label: 'Email', value: user?.email },
                  { label: 'Phone number', value: user?.phoneNumber },
                  { label: 'Account type', value: humanize(user?.userType) },
                  { label: 'Date of birth', value: user?.dateOfBirth ? formatDate(user.dateOfBirth) : null },
                  { label: 'About', value: user?.aboutMe, wide: true },
                ]}
              />
            )}
          </div>
        </Card>
      </div>

      <EditUserModal open={editing} onClose={() => setEditing(false)} user={user ? { ...user, id: userId } : null} onSaved={reload} />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => !working && setConfirm(null)}
        onConfirm={act}
        loading={working}
        title={confirm === 'block' ? `Block ${name}?` : confirm === 'unblock' ? `Unblock ${name}?` : `Delete ${name}?`}
        description={
          confirm === 'block'
            ? "They won't be able to sign in to the app until you unblock them."
            : confirm === 'unblock'
              ? 'They will be able to sign in to the app again.'
              : 'Their account is permanently removed. This cannot be undone.'
        }
        confirmLabel={confirm === 'block' ? 'Block user' : confirm === 'unblock' ? 'Unblock user' : 'Delete permanently'}
        tone={confirm === 'unblock' ? 'primary' : 'danger'}
      />
    </>
  );
};

export default UserProfile;
