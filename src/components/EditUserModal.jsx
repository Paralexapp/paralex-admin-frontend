import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { adminEditUser } from '../api/api';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Field, Input } from './ui/Form';

const toDateInput = (value) => (Array.isArray(value) ? value.slice(0, 3).map((n, i) => String(n).padStart(i ? 2 : 4, '0')).join('-') : value || '');

/** Edit a user's name, phone and date of birth. Email is the login and stays read-only. */
export default function EditUserModal({ open, onClose, user, onSaved }) {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user)
      setForm({ firstName: user.firstName || '', lastName: user.lastName || '', phoneNumber: user.phoneNumber || '', dateOfBirth: toDateInput(user.dateOfBirth) });
    setErrors({});
  }, [open, user]);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const save = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.firstName.trim()) found.firstName = 'Enter a first name.';
    if (!form.lastName.trim()) found.lastName = 'Enter a last name.';
    if (!form.phoneNumber.trim()) found.phoneNumber = 'Enter a phone number.';
    setErrors(found);
    if (Object.keys(found).length) return;

    // Send only what changed
    const changes = {};
    ['firstName', 'lastName', 'phoneNumber'].forEach((key) => {
      if (form[key].trim() !== (user[key] || '')) changes[key] = form[key].trim();
    });
    if (form.dateOfBirth && form.dateOfBirth !== toDateInput(user.dateOfBirth)) changes.dateOfBirth = form.dateOfBirth;
    if (!Object.keys(changes).length) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      await adminEditUser(user.id, changes);
      toast.success('Details updated.');
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
      title="Edit details"
      description={user?.email ? `Email (${user.email}) is their login and can't be changed here.` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="edit-user-form" loading={saving}>Save changes</Button>
        </>
      }
    >
      <form id="edit-user-form" onSubmit={save} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="editFirst" error={errors.firstName}>
          <Input id="editFirst" value={form.firstName || ''} onChange={(e) => set('firstName', e.target.value)} error={errors.firstName} />
        </Field>
        <Field label="Last name" htmlFor="editLast" error={errors.lastName}>
          <Input id="editLast" value={form.lastName || ''} onChange={(e) => set('lastName', e.target.value)} error={errors.lastName} />
        </Field>
        <Field label="Phone number" htmlFor="editPhone" error={errors.phoneNumber}>
          <Input id="editPhone" type="tel" value={form.phoneNumber || ''} onChange={(e) => set('phoneNumber', e.target.value)} error={errors.phoneNumber} />
        </Field>
        <Field label="Date of birth" htmlFor="editDob">
          <Input id="editDob" type="date" value={form.dateOfBirth || ''} onChange={(e) => set('dateOfBirth', e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
