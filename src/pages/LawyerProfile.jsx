import { useParams } from 'react-router-dom';
import { PiEnvelopeSimple, PiPhone, PiMapPin, PiStar } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminGetLawyerByUserId } from '../api/api';
import { getDisplayName } from '../utils/userUtils';
import { formatDate } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import ProfileHero from '../components/ProfileHero';
import { Card, CardHeader } from '../components/ui/Card';
import DetailList from '../components/ui/DetailList';
import Badge from '../components/ui/Badge';
import { ErrorState, Skeleton } from '../components/ui/States';

const LawyerProfile = () => {
  const { userId } = useParams();
  const { data, loading, error, reload } = useAsync(() => adminGetLawyerByUserId(userId), [userId]);
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

  return (
    <>
      <PageHeader title="Lawyer profile" back={back} />
      <div className="space-y-6">
        <ProfileHero
          loading={loading}
          name={name}
          src={lawyer?.photoUrl || user?.photoUrl}
          subtitle={lawyer?.supremeCourtNumber ? `Lawyer · ${lawyer.supremeCourtNumber}` : 'Lawyer'}
          badges={lawyer?.status === false ? <Badge tone="neutral" dot>Disabled</Badge> : <Badge tone="success" dot>Active</Badge>}
          meta={[
            user?.email && { icon: PiEnvelopeSimple, text: user.email },
            user?.phoneNumber && { icon: PiPhone, text: user.phoneNumber },
            lawyer?.state && { icon: PiMapPin, text: lawyer.state },
            lawyer?.totalReviews > 0 && { icon: PiStar, text: `${Number(lawyer.averageRating).toFixed(1)} from ${lawyer.totalReviews} reviews` },
          ].filter(Boolean)}
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
    </>
  );
};

export default LawyerProfile;
