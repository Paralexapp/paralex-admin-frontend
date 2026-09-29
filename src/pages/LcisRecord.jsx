import { useSearchParams } from 'react-router-dom';
import { PiGavel, PiIdentificationCard, PiMapPin, PiCalendarBlank } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { RECORDS_DEMO, getLcisInmate } from '../api/records';
import { extractRecord, lcisCourt, personName, photoSrc, present } from '../utils/records';
import PageHeader from '../components/ui/PageHeader';
import ProfileHero from '../components/ProfileHero';
import Badge from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { EmptyState, ErrorState, SampleDataNotice, Skeleton } from '../components/ui/States';
import RecordFields from '../components/RecordFields';

// Field names as the LCIS API returns them (mixed case is theirs)
const groups = [
  {
    title: 'Personal details',
    fields: [
      ['first_name', 'First name'],
      ['othername', 'Other name'],
      ['last_name', 'Last name'],
      ['gender', 'Sex'],
      ['date_of_birth', 'Date of birth'],
      ['state_of_origin', 'State of origin'],
      ['country_of_orign', 'Country'],
      ['tribe', 'Tribe'],
      ['religion', 'Religion'],
      ['address_of_defendant', 'Address', true],
    ],
  },
  {
    title: 'Offence and arrest',
    fields: [
      ['Offence', 'Offence'],
      ['OffenceCode', 'Offence code'],
      ['Charge_no', 'Charge number'],
      ['Date_Defendant_Arrested', 'Date arrested'],
      ['Location_offence_committed', 'Where the offence happened'],
      ['Name_of_IPO', 'Investigating police officer'],
      ['Location_of_IPO', 'IPO location'],
      ['Police_File_Reference', 'Police file reference'],
    ],
  },
  {
    title: 'Court',
    fields: [
      ['Trial_Court', 'Trial court'],
      ['Magistrate_Court_Name_No', 'Magistrate court'],
      ['High_Court_Name_No', 'High court'],
      ['Last_adjourned_date', 'Last adjourned'],
      ['next_hearing_date', 'Next hearing'],
    ],
  },
  {
    title: 'Custody',
    fields: [
      ['lcis_number', 'LCIS number'],
      ['Prison_name', 'Custodial centre'],
      ['Prisoner_No', 'Prisoner number'],
      ['inmate_category', 'Category'],
      ['prison_yard', 'Yard'],
      ['Date_admission', 'Date admitted'],
      ['date_stamp', 'Recorded'],
    ],
  },
  {
    title: 'Description',
    fields: [
      ['height_scale', 'Height'],
      ['weight_scale', 'Weight'],
      ['colour_of_eyes', 'Eye colour'],
      ['colour_of_hair', 'Hair colour'],
      ['tribal_marks', 'Tribal marks'],
      ['Disability', 'Disability'],
    ],
  },
];

const LcisRecord = () => {
  const [params] = useSearchParams();
  const lcis = params.get('lcis') || '';
  const from = params.get('from');
  const back = from ? { to: `/admin/lcis?${from}`, label: 'Back to results' } : { to: '/admin/lcis', label: 'LCIS search' };
  const { data, loading, error, reload } = useAsync(() => getLcisInmate(lcis), [lcis]);
  const record = extractRecord(data);

  if (error || (!loading && !record)) {
    return (
      <>
        <PageHeader title="Inmate record" back={back} />
        <Card>
          {error ? <ErrorState message={error} onRetry={reload} /> : <EmptyState icon={PiIdentificationCard} title="Record not found" description={`No inmate with LCIS number ${lcis}.`} />}
        </Card>
      </>
    );
  }

  const court = lcisCourt(record);

  return (
    <>
      <PageHeader title="Inmate record" back={back} />
      {RECORDS_DEMO && <SampleDataNotice>Sample record: LCIS isn't connected yet.</SampleDataNotice>}
      <div className="space-y-6">
        <ProfileHero
          loading={loading}
          name={personName(record)}
          src={photoSrc(record?.Photograph)}
          subtitle={record?.lcis_number}
          badges={present(record?.Prison_name) ? <Badge tone="warning" dot>In custody</Badge> : null}
          meta={[
            present(record?.Offence) && { icon: PiIdentificationCard, text: record.Offence },
            court && { icon: PiGavel, text: court },
            present(record?.Prison_name) && { icon: PiMapPin, text: record.Prison_name },
            present(record?.next_hearing_date) && { icon: PiCalendarBlank, text: `Next hearing ${record.next_hearing_date}` },
          ].filter(Boolean)}
        />
        {loading ? <Skeleton className="h-64 rounded-2xl" /> : <RecordFields record={record} groups={groups} hidden={['id', 'full_name', 'Photograph']} />}
      </div>
    </>
  );
};

export default LcisRecord;
