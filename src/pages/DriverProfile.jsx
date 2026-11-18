import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PiEnvelopeSimple, PiPhone, PiStar, PiSteeringWheel, PiPower, PiProhibit, PiLockOpen, PiLock } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminBlockUser, adminDisableRider, adminEnableRider, adminGetDrivers, adminUnblockUser } from '../api/api';
import { formatDate } from '../utils/format';
import { driverName, driverStatus, driverUserId, masked } from '../utils/drivers';
import PageHeader from '../components/ui/PageHeader';
import ProfileHero from '../components/ProfileHero';
import { Card, CardHeader } from '../components/ui/Card';
import PayoutAccountCard from '../components/PayoutAccountCard';
import DetailList from '../components/ui/DetailList';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';

// No single-driver endpoint for admins: load the list and pick the requested profile
const loadDriver = async (id) => {
  const list = await adminGetDrivers();
  return (Array.isArray(list) ? list : []).find((driver) => driver.id === id) || null;
};

const yesNo = (value) => (value ? 'Yes' : 'No');

const DriverProfile = () => {
  const { driverId } = useParams();
  const { data: driver, loading, error, reload } = useAsync(() => loadDriver(driverId), [driverId]);
  const [confirm, setConfirm] = useState(null);
  const [working, setWorking] = useState(false);
  const back = { to: '/admin/drivers', label: 'All drivers' };

  if (error) {
    return (
      <>
        <PageHeader title="Driver profile" back={back} />
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      </>
    );
  }

  if (!loading && !driver) {
    return (
      <>
        <PageHeader title="Driver profile" back={back} />
        <Card>
          <EmptyState icon={PiSteeringWheel} title="Driver not found" description="The profile may have been removed." />
        </Card>
      </>
    );
  }

  const name = driverName(driver);
  const status = driverStatus(driver);
  const enabled = Boolean(driver?.status);
  const awaiting = !enabled && !driver?.disabledByAdmin;

  const blocked = Boolean(driver?.user?.accountBlocked);
  const riderId = driverUserId(driver);

  // Each action shares one confirm dialog
  const actions = {
    disable: {
      title: `Disable ${name}?`,
      description: "They won't be matched to new deliveries or show up as a nearby rider. Their history is kept.",
      confirmLabel: 'Disable driver',
      tone: 'danger',
      run: () => adminDisableRider(riderId),
      done: `${name} was disabled.`,
    },
    enable: {
      title: awaiting ? `Approve ${name}?` : `Enable ${name}?`,
      description: awaiting
        ? 'Check their ID and vehicle details first. Once approved they can go online and take deliveries.'
        : 'They will be able to take deliveries and appear as a nearby rider.',
      confirmLabel: awaiting ? 'Approve rider' : 'Enable driver',
      tone: 'primary',
      run: () => adminEnableRider(riderId),
      done: awaiting ? `${name} is approved.` : `${name} was enabled.`,
    },
    block: {
      title: `Block ${name}?`,
      description: "They can't sign in to the app, so they can't take deliveries. You can unblock them later.",
      confirmLabel: 'Block driver',
      tone: 'danger',
      run: () => adminBlockUser(riderId),
      done: `${name} was blocked.`,
    },
    unblock: {
      title: `Unblock ${name}?`,
      description: 'They can sign in again. If they are also disabled, enable them before they can take jobs.',
      confirmLabel: 'Unblock driver',
      tone: 'primary',
      run: () => adminUnblockUser(riderId),
      done: `${name} was unblocked.`,
    },
  };
  const pending = confirm && actions[confirm];

  const runAction = async () => {
    setWorking(true);
    try {
      await pending.run();
      toast.success(pending.done);
      setConfirm(null);
      reload();
    } catch (err) {
      toast.error(err.error || "We couldn't update this driver. Please try again.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <PageHeader title="Driver profile" back={back} />
      <div className="space-y-6">
        <ProfileHero
          loading={loading}
          name={name}
          src={driver?.passportUrl || driver?.user?.photoUrl}
          subtitle="Driver"
          badges={
            <>
              <Badge tone={status.tone} dot>{status.label}</Badge>
              {blocked && <Badge tone="danger" dot>Blocked</Badge>}
            </>
          }
          meta={[
            driver?.user?.email && { icon: PiEnvelopeSimple, text: driver.user.email },
            driver?.user?.phoneNumber && { icon: PiPhone, text: driver.user.phoneNumber },
            driver?.totalReviews > 0 && { icon: PiStar, text: `${Number(driver.averageRating).toFixed(1)} from ${driver.totalReviews} reviews` },
          ].filter(Boolean)}
          actions={
            !loading && (
              <div className="flex flex-wrap gap-2">
                <Button variant={enabled ? 'danger-ghost' : 'primary'} icon={enabled ? PiProhibit : PiPower} onClick={() => setConfirm(enabled ? 'disable' : 'enable')}>
                  {enabled ? 'Disable driver' : awaiting ? 'Approve rider' : 'Enable driver'}
                </Button>
                <Button variant="secondary" icon={blocked ? PiLockOpen : PiLock} onClick={() => setConfirm(blocked ? 'unblock' : 'block')}>
                  {blocked ? 'Unblock' : 'Block'}
                </Button>
              </div>
            )
          }
        />

        {loading ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Vehicle" />
              <div className="p-6">
                <DetailList
                  items={[
                    { label: 'Has a bike', value: yesNo(driver.hasBike) },
                    { label: 'Has a rider card', value: yesNo(driver.hasRiderCard) },
                    { label: 'Bike type', value: driver.bikeType },
                    { label: 'Bike capacity', value: driver.bikeCapacity },
                    { label: 'Chassis number', value: driver.chassisNumber },
                    { label: 'Joined', value: formatDate(driver.time) },
                  ]}
                />
              </div>
            </Card>
            {/* Riders who signed up before Nov 2026 gave a guarantor; newer riders aren't asked. */}
            {(driver.guarantorPhoneNumber || driver.guarantorEmail || driver.guarantorClass) && (
            <Card>
              <CardHeader title="Guarantor" />
              <div className="p-6">
                <DetailList
                  items={[
                    { label: 'Class', value: driver.guarantorClass },
                    { label: 'Phone', value: driver.guarantorPhoneNumber },
                    { label: 'Email', value: driver.guarantorEmail },
                    { label: 'State of residence', value: driver.guarantorStateOfResidence },
                    { label: 'Address', value: driver.guarantorResidentialAddress, wide: true },
                  ]}
                />
              </div>
            </Card>
            )}
            <Card>
              <CardHeader title="Identity" description="Numbers are partly hidden." />
              <div className="p-6">
                <DetailList
                  items={[
                    { label: 'BVN', value: masked(driver.bvn) },
                    { label: 'NIN', value: masked(driver.nin) },
                  ]}
                />
              </div>
            </Card>
            <PayoutAccountCard userId={driver.userId || driver.creatorId || driver.user?.id} />
          </div>
        )}
      </div>

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

export default DriverProfile;
