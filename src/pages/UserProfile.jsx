import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PiEnvelopeSimple, PiPhone, PiProhibit, PiTrash } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminBlockUser, adminDeleteUser, adminGetUserByUserId } from '../api/api';
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

const UserProfile = () => {
  const { userId } = useParams();
  const { data: user, loading, error, reload } = useAsync(() => adminGetUserByUserId(userId), [userId]);
  const status = accountStatus(user);
  const back = { to: '/admin/users', label: 'All users' };
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(null); // "block" | "delete"
  const [working, setWorking] = useState(false);

  const act = async () => {
    setWorking(true);
    try {
      if (confirm === 'block') {
        await adminBlockUser(userId);
        toast.success('User blocked.');
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
              {!user?.accountBlocked && (
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

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => !working && setConfirm(null)}
        onConfirm={act}
        loading={working}
        title={confirm === 'block' ? `Block ${name}?` : `Delete ${name}?`}
        description={
          confirm === 'block'
            ? "They won't be able to sign in to the app. There's no unblock button yet, so undoing this needs a developer."
            : 'Their account is permanently removed. This cannot be undone.'
        }
        confirmLabel={confirm === 'block' ? 'Block user' : 'Delete permanently'}
        tone="danger"
      />
    </>
  );
};

export default UserProfile;
