import { useState } from 'react';
import { toast } from 'react-toastify';
import { PiPackage, PiUserPlus } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminAssignDelivery, adminGetDeliveries, adminGetDeliveryOrders, adminGetDrivers } from '../api/api';
import { formatDate, formatNaira, toTimestamp } from '../utils/format';
import { driverName } from '../utils/drivers';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Field, Select } from '../components/ui/Form';

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

const orderTone = (label = '') => {
  if (label === 'Delivered') return 'success';
  if (['Cancelled', 'Expired'].includes(label)) return 'danger';
  if (label === 'Awaiting payment' || label === 'Finding a rider') return 'warning';
  return 'brand';
};

const orderColumns = [
  {
    key: 'tracking',
    header: 'Delivery',
    sortValue: (o) => o.trackingId || o.id,
    render: (o) => (
      <div className="min-w-0">
        <p className="tabular font-medium text-stone-900">{o.trackingId || String(o.id).slice(-8)}</p>
        <p className="truncate text-xs text-stone-500">{o.customerName || o.customerEmail || '—'}</p>
      </div>
    ),
  },
  {
    key: 'route',
    header: 'Route',
    render: (o) => (
      <div className="max-w-xs min-w-0">
        <p className="truncate text-stone-800">{o.pickupAddress || '—'}</p>
        <p className="truncate text-xs text-stone-500">to {o.dropoffAddress || '—'}</p>
      </div>
    ),
  },
  { key: 'rider', header: 'Rider', render: (o) => o.riderName || <span className="text-stone-400">None yet</span>, mobileHidden: true },
  {
    key: 'payment',
    header: 'Payment',
    sortValue: (o) => o.totalNgn || 0,
    render: (o) => (
      <div>
        <p className="tabular font-medium text-stone-900">{formatNaira(o.totalNgn)}</p>
        <p className="text-xs text-stone-500">
          {o.paymentMethod === 'PAY_ON_DELIVERY' ? (o.paid ? 'Paid on delivery' : 'Pay on delivery · unpaid') : o.paid ? 'Paid' : 'Not paid'}
        </p>
      </div>
    ),
    mobileHidden: true,
  },
  {
    key: 'status',
    header: 'Status',
    sortValue: (o) => o.statusLabel || '',
    render: (o) => <Badge tone={orderTone(o.statusLabel)} dot>{o.statusLabel}</Badge>,
  },
  { key: 'date', header: 'Booked', sortValue: (o) => toTimestamp(o.createdAt), render: (o) => <span className="tabular text-stone-500">{formatDate(o.createdAt)}</span> },
];

const active = (o) => !['Delivered', 'Cancelled', 'Expired'].includes(o.statusLabel);

/** Deliveries booked in the app (2.x). Rows open the full details. */
const DeliveryOrders = () => {
  const { data, loading, error, reload } = useAsync(adminGetDeliveryOrders);
  return (
    <DataTable
      columns={orderColumns}
      rows={Array.isArray(data) ? data : []}
      loading={loading}
      error={error}
      onRetry={reload}
      rowHref={(o) => `/admin/delivery/${encodeURIComponent(o.id)}`}
      searchText={(o) => `${o.trackingId || ''} ${o.pickupAddress || ''} ${o.dropoffAddress || ''} ${o.customerName || ''} ${o.customerEmail || ''} ${o.recipientName || ''} ${o.riderName || ''}`}
      searchPlaceholder="Search by tracking ID, address, customer or rider"
      filters={[
        { label: 'All', value: 'all' },
        { label: 'In progress', value: 'active', predicate: active },
        { label: 'Unpaid on delivery', value: 'unpaid', predicate: (o) => o.paymentMethod === 'PAY_ON_DELIVERY' && !o.paid && active(o) },
        { label: 'Delivered', value: 'done', predicate: (o) => o.statusLabel === 'Delivered' },
        { label: 'Cancelled', value: 'cancelled', predicate: (o) => ['Cancelled', 'Expired'].includes(o.statusLabel) },
      ]}
      initialSort={{ key: 'date', dir: 'desc' }}
      empty={{ icon: PiPackage, title: 'No deliveries yet', description: 'Deliveries booked in the app will appear here.' }}
    />
  );
};

const tabs = [
  { value: 'orders', label: 'Deliveries' },
  { value: 'legacy', label: 'Older requests' },
];

const DeliveryRequest = () => {
  const [tab, setTab] = useState('orders');
  return (
    <>
      <PageHeader title="Deliveries" description="Every delivery booked in the app. Click one to see the customer, rider, route, payment and timeline." />
      <div className="mb-5 inline-flex gap-1 rounded-lg bg-stone-200/60 p-1" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition ${tab === t.value ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'orders' ? <DeliveryOrders /> : <LegacyRequests />}
    </>
  );
};

/** Delivery requests from the older system, with manual rider assignment. */
const LegacyRequests = () => {
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
      <div className="mb-3 flex justify-end">
        <Button icon={PiUserPlus} onClick={() => setOpen(true)} disabled={loading || Boolean(error)}>
          Assign rider
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={deliveries}
        loading={loading}
        error={error}
        onRetry={reload}
        rowHref={(d) => `/admin/delivery/${encodeURIComponent(d.id)}`}
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
