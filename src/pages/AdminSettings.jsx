import { useState } from 'react';
import { toast } from 'react-toastify';
import { PiPlus, PiShieldCheck, PiUsersThree } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminCreateAdmin, adminGetAllAdmins } from '../api/api';
import { getAdminProfile } from '../api/authHelper';
import { getDisplayName } from '../utils/userUtils';
import { formatDate, toTimestamp } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Field, Input } from '../components/ui/Form';

export default function AdminSettings() {
  const { data, loading, error, reload } = useAsync(adminGetAllAdmins);
  const me = getAdminProfile();
  const [open, setOpen] = useState(false);
  const emptyForm = { firstName: '', lastName: '', email: '', phoneNumber: '', password: '' };
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const columns = [
    {
      key: 'name',
      header: 'Admin',
      sortValue: (admin) => getDisplayName(admin).toLowerCase(),
      render: (admin) => (
        <div className="flex items-center gap-3">
          <Avatar name={getDisplayName(admin)} src={admin.photoUrl} size="sm" />
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate font-medium text-stone-900">
              {getDisplayName(admin)}
              {admin.email === me.email && <Badge tone="brand">You</Badge>}
            </p>
            <p className="truncate text-xs text-stone-500">{admin.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: () => <Badge tone="neutral"><PiShieldCheck className="size-3.5" /> Admin</Badge> },
    { key: 'added', header: 'Added', sortValue: (admin) => toTimestamp(admin.time), render: (admin) => <span className="tabular text-stone-500">{formatDate(admin.time)}</span> },
  ];

  const close = () => {
    setOpen(false);
    setForm(emptyForm);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!form.firstName.trim() || !form.lastName.trim() || !email || !form.password) {
      setFormError('Fill in the name, email and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Enter a valid email address.');
      return;
    }
    if (form.password.length < 8) {
      setFormError('Use a password of at least 8 characters.');
      return;
    }
    // The backend silently renames an existing admin when the email is reused, so stop that here
    if ((Array.isArray(data) ? data : []).some((admin) => (admin.email || '').toLowerCase() === email)) {
      setFormError('That email already belongs to an admin.');
      return;
    }
    setSaving(true);
    try {
      await adminCreateAdmin({ ...form, email, firstName: form.firstName.trim(), lastName: form.lastName.trim() });
      toast.success(`${form.firstName.trim()} can now sign in as an admin.`);
      close();
      reload();
    } catch (err) {
      setFormError(typeof err.error === 'string' ? err.error : "We couldn't add this admin. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Admins"
        description="People who can sign in to this dashboard."
        actions={<Button icon={PiPlus} onClick={() => setOpen(true)}>Add admin</Button>}
      />
      <DataTable
        columns={columns}
        rows={Array.isArray(data) ? data : []}
        loading={loading}
        error={error}
        onRetry={reload}
        searchText={(admin) => `${getDisplayName(admin)} ${admin.email || ''}`}
        searchPlaceholder="Search admins"
        initialSort={{ key: 'added', dir: 'asc' }}
        empty={{ icon: PiUsersThree, title: 'No admins found' }}
      />

      <Modal
        open={open}
        onClose={close}
        title="Add an admin"
        description="They'll be able to sign in and manage everything in this dashboard."
        footer={
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button type="submit" form="add-admin-form" loading={saving}>Add admin</Button>
          </>
        }
      >
        <form id="add-admin-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          {formError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2">{formError}</p>}
          <Field label="First name" htmlFor="adminFirst">
            <Input id="adminFirst" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </Field>
          <Field label="Last name" htmlFor="adminLast">
            <Input id="adminLast" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </Field>
          <Field label="Email" htmlFor="adminEmail" className="sm:col-span-2">
            <Input id="adminEmail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Phone number" htmlFor="adminPhone" className="sm:col-span-2">
            <Input id="adminPhone" type="tel" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
          </Field>
          <Field label="Temporary password" htmlFor="adminPassword" hint="At least 8 characters. Share it with them privately." className="sm:col-span-2">
            <Input id="adminPassword" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
