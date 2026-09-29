import { useParams, useSearchParams } from 'react-router-dom';
import { PiFolderOpen, PiGavel, PiMapPin } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { RECORDS_DEMO, getBimsRecord } from '../api/records';
import { extractRecord, personName, bimsTone, present } from '../utils/records';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { EmptyState, ErrorState, SampleDataNotice, Skeleton } from '../components/ui/States';
import RecordFields from '../components/RecordFields';

const groups = [
  {
    title: 'Defendant',
    fields: [
      ['defendant_first_name', 'First name'],
      ['defendant_last_name', 'Last name'],
      ['defendant_lcis_number', 'LCIS number'],
      ['defendant_status', 'Status'],
      ['defendant_location', 'Custodial centre', true],
    ],
  },
  {
    title: 'Case and court',
    fields: [
      ['defendant_offense', 'Offence'],
      ['charge_no', 'Charge number'],
      ['case_title', 'Case title'],
      ['court', 'Court'],
      ['defendant_court_magname', 'Magistrate court'],
      ['defendant_court_highname', 'High court'],
    ],
  },
  {
    title: 'Surety',
    fields: [
      ['title', 'Title'],
      ['first_name', 'First name'],
      ['surname', 'Surname'],
      ['gender', 'Sex'],
      ['phone', 'Phone'],
      ['email', 'Email'],
      ['id_type', 'ID type'],
      ['id_number', 'ID number'],
      ['nin_status', 'NIN check'],
      ['current_address', 'Current address', true],
      ['permanent_address', 'Permanent address', true],
    ],
  },
  {
    title: 'Bail',
    fields: [
      ['uuid', 'BIMS number'],
      ['status', 'Bail status'],
      ['payment_status', 'Payment'],
      ['bail_bond', 'Bail bond'],
      ['created_at', 'Recorded'],
      ['comments', 'Comments', true],
    ],
  },
];

const BimsRecord = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const from = params.get('from');
  const back = from ? { to: `/admin/bims?${from}`, label: 'Back to results' } : { to: '/admin/bims', label: 'BIMS search' };
  const { data, loading, error, reload } = useAsync(() => getBimsRecord(id), [id]);
  const record = extractRecord(data);

  if (error || (!loading && !record)) {
    return (
      <>
        <PageHeader title="Bail record" back={back} />
        <Card>{error ? <ErrorState message={error} onRetry={reload} /> : <EmptyState icon={PiFolderOpen} title="Record not found" />}</Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={loading ? 'Bail record' : personName(record)}
        description={loading ? null : `BIMS record ${record.uuid || record.id}`}
        back={back}
        actions={!loading && record.status ? <Badge tone={bimsTone(record.status)} dot>{record.status}</Badge> : null}
      />
      {RECORDS_DEMO && <SampleDataNotice>Sample record: BIMS isn't connected yet.</SampleDataNotice>}
      {loading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <div className="space-y-6">
          <Card className="grid gap-px overflow-hidden bg-stone-100 sm:grid-cols-3">
            {[
              { icon: PiGavel, label: 'Offence', value: record.defendant_offense },
              { icon: PiMapPin, label: 'Custodial centre', value: record.defendant_location },
              { icon: PiFolderOpen, label: 'Surety', value: present(record.surety_full_name) ? record.surety_full_name : 'None listed' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 bg-white px-5 py-4">
                <Icon className="mt-0.5 size-5 text-brand-700" />
                <div>
                  <p className="text-xs font-medium text-stone-500">{label}</p>
                  <p className="mt-0.5 text-sm font-medium text-stone-900">{value || '—'}</p>
                </div>
              </div>
            ))}
          </Card>
          <RecordFields record={record} groups={groups} hidden={['id', 'image', 'photograph', 'finger_print', 'full_name', 'surety_full_name', 'boil_bond_type']} />
        </div>
      )}
    </>
  );
};

export default BimsRecord;
