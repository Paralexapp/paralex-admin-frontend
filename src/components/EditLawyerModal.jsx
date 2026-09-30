import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { adminEditLawyer } from '../api/api';
import { practiceAreas as allPracticeAreas } from '../utils/practiceAreas';
import { listStates } from '../utils/practiceStates';
import Modal from './ui/Modal';
import Button from './ui/Button';
import ChipSelect from './ui/ChipSelect';
import { Field, Input, Select, Textarea } from './ui/Form';

const fromLawyer = (lawyer) => ({
  firstName: lawyer?.user?.firstName || '',
  lastName: lawyer?.user?.lastName || '',
  phoneNumber: lawyer?.user?.phoneNumber || '',
  state: lawyer?.state || '',
  supremeCourtNumber: lawyer?.supremeCourtNumber || '',
  nbabranchAffiliation: lawyer?.nbabranchAffiliation || '',
  aboutMe: lawyer?.aboutMe || '',
  practiceAreas: lawyer?.practiceAreas || [],
});

/** Edit a lawyer's account details and practice profile */
export default function EditLawyerModal({ open, onClose, lawyer, userId, onSaved }) {
  const [form, setForm] = useState(fromLawyer(lawyer));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(fromLawyer(lawyer));
    setErrors({});
  }, [open, lawyer]);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // Keep any area already on the profile selectable, even if it isn't in today's list
  const options = [...new Set([...allPracticeAreas, ...(lawyer?.practiceAreas || [])])];

  const save = async (e) => {
    e.preventDefault();
    const found = {};
    ['firstName', 'lastName', 'phoneNumber', 'state', 'supremeCourtNumber'].forEach((key) => {
      if (!String(form[key]).trim()) found[key] = 'This field is required.';
    });
    if (!form.practiceAreas.length) found.practiceAreas = 'Keep at least one practice area.';
    setErrors(found);
    if (Object.keys(found).length) return;

    const original = fromLawyer(lawyer);
    const changes = {};
    Object.keys(form).forEach((key) => {
      const now = key === 'practiceAreas' ? form[key] : String(form[key]).trim();
      const before = original[key];
      if (JSON.stringify(now) !== JSON.stringify(before)) changes[key] = now;
    });
    if (!Object.keys(changes).length) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      await adminEditLawyer(userId, changes);
      toast.success('Lawyer profile updated.');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(typeof err.error === 'string' ? err.error : "We couldn't save these changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      size="lg"
      title="Edit lawyer profile"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="edit-lawyer-form" loading={saving}>Save changes</Button>
        </>
      }
    >
      <form id="edit-lawyer-form" onSubmit={save} noValidate className="grid max-h-[65vh] gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
        <Field label="First name" htmlFor="lwFirst" error={errors.firstName}>
          <Input id="lwFirst" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} error={errors.firstName} />
        </Field>
        <Field label="Last name" htmlFor="lwLast" error={errors.lastName}>
          <Input id="lwLast" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} error={errors.lastName} />
        </Field>
        <Field label="Phone number" htmlFor="lwPhone" error={errors.phoneNumber}>
          <Input id="lwPhone" type="tel" value={form.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)} error={errors.phoneNumber} />
        </Field>
        <Field label="State of practice" htmlFor="lwState" error={errors.state}>
          <Select id="lwState" value={form.state} onChange={(e) => set('state', e.target.value)} error={errors.state}>
            <option value="">Select a state</option>
            {[...new Set([...listStates, form.state].filter(Boolean))].map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </Select>
        </Field>
        <Field label="Supreme Court number" htmlFor="lwScn" error={errors.supremeCourtNumber}>
          <Input id="lwScn" value={form.supremeCourtNumber} onChange={(e) => set('supremeCourtNumber', e.target.value)} error={errors.supremeCourtNumber} />
        </Field>
        <Field label="NBA branch" htmlFor="lwNba">
          <Input id="lwNba" value={form.nbabranchAffiliation} onChange={(e) => set('nbabranchAffiliation', e.target.value)} />
        </Field>
        <Field label="About" htmlFor="lwAbout" className="sm:col-span-2">
          <Textarea id="lwAbout" maxLength={500} value={form.aboutMe} onChange={(e) => set('aboutMe', e.target.value)} />
        </Field>
        <Field label="Practice areas" error={errors.practiceAreas} hint={`${form.practiceAreas.length} selected`} className="sm:col-span-2">
          <ChipSelect options={options} value={form.practiceAreas} onChange={(value) => set('practiceAreas', value)} error={errors.practiceAreas} />
        </Field>
      </form>
    </Modal>
  );
}
