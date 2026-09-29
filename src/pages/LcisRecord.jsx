import { useSearchParams } from 'react-router-dom';
import { PiIdentificationCard, PiMapPin, PiPhone } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { RECORDS_DEMO, getLcisInmate } from '../api/records';
import { extractRecord, personName, photoSrc, bimsTone } from '../utils/records';
import PageHeader from '../components/ui/PageHeader';
import ProfileHero from '../components/ProfileHero';
import Badge from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { EmptyState, ErrorState, SampleDataNotice, Skeleton } from '../components/ui/States';
import RecordFields from '../components/RecordFields';

const groups = [
  {
    title: 'Personal details',
    fields: [
      ['first_name', 'First name'],
      ['othername', 'Other name'],
      ['last_name', 'Last name'],
      ['gender', 'Sex'],
      ['date_of_birth', 'Date of birth'],
      ['phone_number', 'Phone'],
      ['address', 'Address', true],
    ],
  },
  {
    title: 'Offence and court',
    fields: [
      ['offense', 'Offence'],
      ['charge_no', 'Charge number'],
      ['court', 'Court'],
      ['court_name', 'Court name'],
    ],
  },
  {
    title: 'Custody',
    fields: [
      ['lcis_number', 'LCIS number'],
      ['prison', 'Custodial centre'],
      ['status', 'Status'],
      ['date_admitted', 'Date admitted'],
    ],
  },
];

const LcisRecord = () => {
  const [params] = useSearchParams();
  const lcis = params.get('lcis') || '';
  const { data, loading, error, reload } = useAsync(() => getLcisInmate(lcis), [lcis]);
  const record = extractRecord(data);
  // The search page passes its query along so Back returns to the same results
  const from = params.get('from');
  const back = from ? { to: `/admin/lcis?${from}`, label: 'Back to results' } : { to: '/admin/lcis', label: 'LCIS search' };

  if (error || (!loading && !record)) {
    return (
      <>
        <PageHeader title="Inmate record" back={{ to: '/admin/lcis', label: 'LCIS search' }} />
        <Card>
          {error ? <ErrorState message={error} onRetry={reload} /> : <EmptyState icon={PiIdentificationCard} title="Record not found" description={`No inmate with LCIS number ${lcis}.`} />}
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Inmate record" back={back} />
      {RECORDS_DEMO && <SampleDataNotice>Sample record: LCIS isn't connected yet.</SampleDataNotice>}
      <div className="space-y-6">
        <ProfileHero
          loading={loading}
          name={personName(record)}
          src={photoSrc(record?.photograph)}
          subtitle={record?.lcis_number}
          badges={record?.status ? <Badge tone={bimsTone(record.status)} dot>{record.status}</Badge> : null}
          meta={[
            record?.offense && { icon: PiIdentificationCard, text: record.offense },
            record?.phone_number && { icon: PiPhone, text: record.phone_number },
            record?.prison && { icon: PiMapPin, text: record.prison },
          ].filter(Boolean)}
        />
        {loading ? <Skeleton className="h-64 rounded-2xl" /> : <RecordFields record={record} groups={groups} hidden={['photograph', 'id']} />}
      </div>
    </>
  );
};

export default LcisRecord;
