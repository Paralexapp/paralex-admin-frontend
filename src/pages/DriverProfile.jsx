import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PiEnvelopeSimple, PiPhone, PiStar, PiSteeringWheel, PiPower, PiProhibit } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminDisableRider, adminEnableRider, adminGetDrivers } from '../api/api';
import { formatDate } from '../utils/format';
import { driverName, driverStatus, driverUserId, masked } from '../utils/drivers';
import PageHeader from '../components/ui/PageHeader';
import ProfileHero from '../components/ProfileHero';
import { Card, CardHeader } from '../components/ui/Card';
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
  const [confirm, setConfirm] = useState(false);
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

  const toggle = async () => {
    setWorking(true);
    try {
      if (enabled) await adminDisableRider(driverUserId(driver));
      else await adminEnableRider(driverUserId(driver));
      toast.success(enabled ? `${name} was disabled.` : `${name} was enabled.`);
      setConfirm(false);
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
          badges={<Badge tone={status.tone} dot>{status.label}</Badge>}
          meta={[
            driver?.user?.email && { icon: PiEnvelopeSimple, text: driver.user.email },
            driver?.user?.phoneNumber && { icon: PiPhone, text: driver.user.phoneNumber },
            driver?.totalReviews > 0 && { icon: PiStar, text: `${Number(driver.averageRating).toFixed(1)} from ${driver.totalReviews} reviews` },
          ].filter(Boolean)}
          actions={
            !loading && (
              <Button variant={enabled ? 'danger-ghost' : 'primary'} icon={enabled ? PiProhibit : PiPower} onClick={() => setConfirm(true)}>
                {enabled ? 'Disable driver' : 'Enable driver'}
              </Button>
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
            <Card>
              <CardHeader title="Bank and identity" description="Numbers are partly hidden." />
              <div className="p-6">
                <DetailList
                  items={[
                    { label: 'Bank', value: driver.bankName },
                    { label: 'Account name', value: driver.accountName },
                    { label: 'Account number', value: masked(driver.accountNumber) },
                    { label: 'BVN', value: masked(driver.bvn) },
                    { label: 'NIN', value: masked(driver.nin) },
                  ]}
                />
              </div>
            </Card>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => !working && setConfirm(false)}
        onConfirm={toggle}
        loading={working}
        title={enabled ? `Disable ${name}?` : `Enable ${name}?`}
        description={
          enabled
            ? "They won't be matched to new deliveries or show up as a nearby rider. Their history is kept."
            : 'They will be able to take deliveries and appear as a nearby rider.'
        }
        confirmLabel={enabled ? 'Disable driver' : 'Enable driver'}
        tone={enabled ? 'danger' : 'primary'}
      />
    </>
  );
};

export default DriverProfile;
