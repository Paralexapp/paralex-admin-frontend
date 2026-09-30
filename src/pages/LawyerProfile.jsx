import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PiEnvelopeSimple, PiPhone, PiMapPin, PiStar, PiPencilSimple, PiEyeSlash, PiEye, PiProhibit, PiLockOpen, PiTrash } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminBlockUser, adminDeleteUser, adminDisableLawyer, adminEnableLawyer, adminGetLawyerByUserId, adminUnblockUser } from '../api/api';
import { lawyerStatus } from '../utils/status';
import { getDisplayName } from '../utils/userUtils';
import { formatDate } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import ProfileHero from '../components/ProfileHero';
import { Card, CardHeader } from '../components/ui/Card';
import DetailList from '../components/ui/DetailList';
import Badge from '../components/ui/Badge';
import { ErrorState, Skeleton } from '../components/ui/States';
import Button from '../components/ui/Button';
import EditLawyerModal from '../components/EditLawyerModal';
import { ConfirmDialog } from '../components/ui/Modal';

const LawyerProfile = () => {
  const { userId } = useParams();
  const { data, loading, error, reload } = useAsync(() => adminGetLawyerByUserId(userId), [userId]);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [working, setWorking] = useState(false);
  const navigate = useNavigate();
  const lawyer = data?.data;
  const back = { to: '/admin/lawyers', label: 'All lawyers' };

  if (error || (!loading && !lawyer)) {
    return (
      <>
        <PageHeader title="Lawyer profile" back={back} />
        <Card>
          <ErrorState message={error || "We couldn't find a lawyer profile for this account."} onRetry={reload} />
        </Card>
      </>
    );
  }

  const user = lawyer?.user;
  const name = user ? getDisplayName(user) : lawyer?.lawyerName || 'Lawyer';
  const areas = lawyer?.practiceAreas || [];
  const status = lawyerStatus(lawyer);
  const blocked = Boolean(user?.accountBlocked);
  const disabled = Boolean(lawyer?.disabledByAdmin);

  // Each action shares one confirm dialog; `run` does the work and says what happened
  const actions = {
    disable: {
      title: `Disable ${name}?`,
      description: "They are hidden from the app, so customers can't find or book them. Nothing is deleted and they can still sign in.",
      confirmLabel: 'Disable lawyer',
      tone: 'danger',
      run: () => adminDisableLawyer(userId),
      done: `${name} was disabled and is hidden from the app.`,
    },
    enable: {
      title: `Enable ${name}?`,
      description: 'They will show up in the app again.',
      confirmLabel: 'Enable lawyer',
      tone: 'primary',
      run: () => adminEnableLawyer(userId),
      done: `${name} was enabled.`,
    },
    block: {
      title: `Block ${name}?`,
      description: "They can't sign in and are hidden from the app. You can unblock them later.",
      confirmLabel: 'Block lawyer',
      tone: 'danger',
      run: () => adminBlockUser(userId),
      done: `${name} was blocked.`,
    },
    unblock: {
      title: `Unblock ${name}?`,
      description: 'They can sign in again. If they are also disabled, they stay hidden until you enable them.',
      confirmLabel: 'Unblock lawyer',
      tone: 'primary',
      run: () => adminUnblockUser(userId),
      done: `${name} was unblocked.`,
    },
    delete: {
      title: `Delete ${name}?`,
      description: 'This permanently removes their account, lawyer profile and reviews. It cannot be undone.',
      confirmLabel: 'Delete lawyer',
      tone: 'danger',
      run: () => adminDeleteUser(userId),
      done: `${name} was deleted.`,
      after: () => navigate('/admin/lawyers', { replace: true }),
    },
  };
  const pending = confirm && actions[confirm];

  const runAction = async () => {
    setWorking(true);
    try {
      await pending.run();
      toast.success(pending.done);
      setConfirm(null);
      if (pending.after) pending.after();
      else reload();
    } catch (err) {
      toast.error(err.error || "We couldn't update this lawyer. Please try again.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <PageHeader title="Lawyer profile" back={back} />
      <div className="space-y-6">
        <ProfileHero
          loading={loading}
          name={name}
          src={lawyer?.photoUrl || user?.photoUrl}
          subtitle={lawyer?.supremeCourtNumber ? `Lawyer · ${lawyer.supremeCourtNumber}` : 'Lawyer'}
          badges={<Badge tone={status.tone} dot>{status.label}</Badge>}
          meta={[
            user?.email && { icon: PiEnvelopeSimple, text: user.email },
            user?.phoneNumber && { icon: PiPhone, text: user.phoneNumber },
            lawyer?.state && { icon: PiMapPin, text: lawyer.state },
            lawyer?.totalReviews > 0 && { icon: PiStar, text: `${Number(lawyer.averageRating).toFixed(1)} from ${lawyer.totalReviews} reviews` },
          ].filter(Boolean)}
          actions={
            !loading && (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" icon={PiPencilSimple} onClick={() => setEditing(true)}>
                  Edit profile
                </Button>
                <Button variant="secondary" icon={disabled ? PiEye : PiEyeSlash} onClick={() => setConfirm(disabled ? 'enable' : 'disable')}>
                  {disabled ? 'Enable' : 'Disable'}
                </Button>
                <Button variant="secondary" icon={blocked ? PiLockOpen : PiProhibit} onClick={() => setConfirm(blocked ? 'unblock' : 'block')}>
                  {blocked ? 'Unblock' : 'Block'}
                </Button>
                <Button variant="danger-ghost" icon={PiTrash} onClick={() => setConfirm('delete')}>
                  Delete
                </Button>
              </div>
            )
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Profile" />
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
                    { label: 'State of practice', value: lawyer?.state },
                    { label: 'Supreme Court number', value: lawyer?.supremeCourtNumber },
                    { label: 'NBA branch', value: lawyer?.nbabranchAffiliation },
                    { label: 'Joined', value: lawyer?.time ? formatDate(lawyer.time) : null },
                    { label: 'About', value: lawyer?.aboutMe, wide: true },
                  ]}
                />
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Practice areas" description={loading ? null : `${areas.length} selected`} />
            <div className="p-6">
              {loading ? (
                <Skeleton className="h-16" />
              ) : areas.length ? (
                <div className="flex flex-wrap gap-2">
                  {areas.map((area) => (
                    <Badge key={area} tone="brand">
                      {area}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500">No practice areas listed.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
      <EditLawyerModal open={editing} onClose={() => setEditing(false)} lawyer={lawyer} userId={userId} onSaved={reload} />
      <ConfirmDialog
        open={Boolean(pending)}
        onClose={() => !working && setConfirm(null)}
        onConfirm={runAction}
        loading={working}
        title={pending?.title}
        description={pending?.description}
        confirmLabel={pending?.confirmLabel}
        tone={pending?.tone}
      />
    </>
  );
};

export default LawyerProfile;
