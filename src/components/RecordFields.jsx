import { Card, CardHeader } from './ui/Card';
import DetailList from './ui/DetailList';
import { labelFor, present } from '../utils/records';

/**
 * Cards for an external record. `groups` pick and label the important fields as
 * [key, label, wide?]; anything else the API returns lands in "Other details", so a field the
 * API adds later is never silently dropped.
 */
export default function RecordFields({ record, groups, hidden = [] }) {
  const listed = new Set([...groups.flatMap((g) => g.fields.map(([key]) => key)), ...hidden]);
  const extra = Object.entries(record || {}).filter(
    ([key, value]) => !listed.has(key) && present(value) && (value === null || typeof value !== 'object')
  );
  const sections = [...groups, ...(extra.length ? [{ title: 'Other details', fields: extra.map(([key]) => [key, labelFor(key)]) }] : [])];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader title={section.title} />
          <div className="p-6">
            <DetailList
              items={section.fields.map(([key, label, wide]) => ({ label, value: present(record?.[key]) ? String(record[key]) : null, wide }))}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}
