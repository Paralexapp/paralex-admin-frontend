import { useState } from 'react';
import { toast } from 'react-toastify';
import { PiPackage, PiUserPlus } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminAssignDelivery, adminGetDeliveries, adminGetDrivers } from '../api/api';
import { formatDate, toTimestamp } from '../utils/format';
import { driverName } from '../utils/drivers';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Field, Select } from '../components/ui/Form';
import { Notice } from '../components/ui/States';

// Deliveries and riders load together so the table can show rider names and the assign form
// can offer real choices instead of typed IDs.
const loadAll = async () => {
  const [deliveries, drivers] = await Promise.allSettled([adminGetDeliveries(), adminGetDrivers()]);
  if (deliveries.status === 'rejected') throw deliveries.reason;
  return {
    deliveries: Array.isArray(deliveries.value) ? deliveries.value : [],
    drivers: drivers.status === 'fulfilled' && Array.isArray(drivers.value) ? drivers.value : [],
  };
};

const stageTone = (stage) => {
  if (!stage) return 'neutral';
  if (stage.terminal) return 'success';
  if (stage.initial) return 'warning';
  return 'brand';
};

const DeliveryRequest = () => {
  const { data, loading, error, reload } = useAsync(loadAll);
  const deliveries = data?.deliveries || [];
  const drivers = data?.drivers || [];
  const driverById = Object.fromEntries(drivers.map((d) => [d.id, d]));

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ deliveryRequestId: '', driverProfileId: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const unassigned = deliveries.filter((d) => !d.driverProfileId && !d.deliveryStage?.terminal);
  const availableDrivers = drivers.filter((d) => d.status);

  const columns = [
    {
      key: 'tracking',
      header: 'Tracking ID',
      sortValue: (d) => d.trackingId || '',
      render: (d) => <span className="tabular font-medium text-stone-900">{d.trackingId || String(d.id).slice(-8)}</span>,
    },
    {
      key: 'route',
      header: 'Route',
      render: (d) => (
        <div className="max-w-xs min-w-0">
          <p className="truncate text-stone-800">{d.pickup?.address || '—'}</p>
          <p className="truncate text-xs text-stone-500">to {d.destination?.address || '—'}</p>
        </div>
      ),
    },
    { key: 'customer', header: 'Customer', render: (d) => d.pickup?.customerName || '—', mobileHidden: true },
    {
      key: 'rider',
      header: 'Rider',
      render: (d) =>
        d.driverProfileId ? (driverById[d.driverProfileId] ? driverName(driverById[d.driverProfileId]) : 'Assigned') : <span className="text-stone-400">Unassigned</span>,
    },
    {
      key: 'stage',
      header: 'Stage',
      sortValue: (d) => d.deliveryStage?.sequence ?? 0,
      render: (d) => <Badge tone={stageTone(d.deliveryStage)} dot>{d.deliveryStage?.name || 'Unknown'}</Badge>,
    },
    { key: 'date', header: 'Requested', sortValue: (d) => toTimestamp(d.time), render: (d) => <span className="tabular text-stone-500">{formatDate(d.time)}</span> },
  ];

  const close = () => {
    setOpen(false);
    setForm({ deliveryRequestId: '', driverProfileId: '' });
    setFormError('');
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!form.deliveryRequestId || !form.driverProfileId) {
      setFormError('Choose a delivery and a rider.');
      return;
    }
    setSaving(true);
    try {
      await adminAssignDelivery(form);
      toast.success('Rider assigned. They will be asked to accept the delivery.');
      close();
      reload();
    } catch (err) {
      setFormError(err.error || "We couldn't assign this delivery. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Deliveries"
        description="Delivery requests and the riders handling them."
        actions={
          <Button icon={PiUserPlus} onClick={() => setOpen(true)} disabled={loading || Boolean(error)}>
            Assign rider
          </Button>
        }
      />

      {error && (
        <Notice tone="warning" title="The server couldn't load deliveries" className="mb-6">
          This is a known server bug: the delivery list fails for everyone, including the mobile app. The fix is ready in the backend code but hasn't been
          deployed to the live server yet.
        </Notice>
      )}

      <DataTable
        columns={columns}
        rows={deliveries}
        loading={loading}
        error={error}
        onRetry={reload}
        searchText={(d) => `${d.trackingId || ''} ${d.pickup?.address || ''} ${d.destination?.address || ''} ${d.pickup?.customerName || ''}`}
        searchPlaceholder="Search by tracking ID, address or customer"
        filters={[
          { label: 'All', value: 'all' },
          { label: 'Unassigned', value: 'unassigned', predicate: (d) => !d.driverProfileId && !d.deliveryStage?.terminal },
          { label: 'In progress', value: 'progress', predicate: (d) => d.driverProfileId && !d.deliveryStage?.terminal },
          { label: 'Completed', value: 'done', predicate: (d) => d.deliveryStage?.terminal },
        ]}
        initialSort={{ key: 'date', dir: 'desc' }}
        empty={{ icon: PiPackage, title: 'No delivery requests yet', description: 'Requests made in the app will appear here.' }}
      />

      <Modal
        open={open}
        onClose={close}
        title="Assign a rider"
        description="The rider is asked to accept the job in their app."
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" form="assign-form" loading={saving}>
              Assign
            </Button>
          </>
        }
      >
        <form id="assign-form" onSubmit={handleAssign} className="space-y-4" noValidate>
          {formError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>}
          <Field label="Delivery" htmlFor="deliveryRequestId" hint={unassigned.length ? null : 'No unassigned deliveries right now.'}>
            <Select id="deliveryRequestId" value={form.deliveryRequestId} onChange={(e) => setForm({ ...form, deliveryRequestId: e.target.value })}>
              <option value="">Choose a delivery</option>
              {unassigned.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.trackingId || String(d.id).slice(-8)} · {d.pickup?.address || 'Unknown pickup'}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Rider" htmlFor="driverProfileId" hint={availableDrivers.length ? null : 'No enabled riders right now.'}>
            <Select id="driverProfileId" value={form.driverProfileId} onChange={(e) => setForm({ ...form, driverProfileId: e.target.value })}>
              <option value="">Choose a rider</option>
              {availableDrivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {driverName(d)}
                  {d.offline ? ' (offline)' : ''}
                </option>
              ))}
            </Select>
          </Field>
        </form>
      </Modal>
    </>
  );
};

export default DeliveryRequest;
