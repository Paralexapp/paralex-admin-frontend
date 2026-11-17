import { Link, useParams } from 'react-router-dom';
import { PiPackage } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminGetDeliveryOrder } from '../api/api';
import { formatDate, formatNaira, humanize } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import DetailList from '../components/ui/DetailList';
import Badge from '../components/ui/Badge';
import { EmptyState, ErrorState, Notice, Skeleton } from '../components/ui/States';

const tone = (label = '') => {
  if (label === 'Delivered') return 'success';
  if (['Cancelled', 'Expired'].includes(label)) return 'danger';
  if (label === 'Awaiting payment' || label === 'Finding a rider') return 'warning';
  return 'brand';
};

const yesNo = (v) => (v ? 'Yes' : 'No');

function Section({ title, description, items, children }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <div className="p-6">
        {items && <DetailList items={items} />}
        {children}
      </div>
    </Card>
  );
}

/** One delivery: customer, rider, route, parcel, payment, timeline and proof of delivery. */
const DeliveryDetail = () => {
  const { id } = useParams();
  const { data: d, loading, error, reload } = useAsync(() => adminGetDeliveryOrder(id), [id]);
  const back = { to: '/admin/logistics', label: 'All deliveries' };

  if (error) {
    const notFound = /not found/i.test(String(error));
    return (
      <>
        <PageHeader title="Delivery" back={back} />
        <Card>
          {notFound ? (
            <EmptyState
              icon={PiPackage}
              title="No details for this delivery"
              description="This is an older delivery request from before the current app, so only the summary in the list is available."
            />
          ) : (
            <ErrorState message={error} onRetry={reload} />
          )}
        </Card>
      </>
    );
  }

  if (loading || !d) {
    return (
      <>
        <PageHeader title="Delivery" back={back} />
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </div>
      </>
    );
  }

  const pod = d.paymentMethod === 'PAY_ON_DELIVERY';
  const rider = d.rider || null;
  const customer = d.customer || {};

  return (
    <>
      <PageHeader
        title={`Delivery ${d.trackingId || String(d.id).slice(-8)}`}
        description={`Booked ${formatDate(d.createdAt)}`}
        back={back}
        actions={<Badge tone={tone(d.statusLabel)} dot>{d.statusLabel}</Badge>}
      />

      <div className="space-y-4">
        {d.paymentFollowUp && (
          <Notice tone="warning" title="Customer hasn't paid">
            The rider reported the customer can't pay on delivery{d.paymentFollowUpNote ? `: “${d.paymentFollowUpNote}”` : '.'} Decide in the app under
            Rider payouts → Unpaid.
          </Notice>
        )}
        {d.problemReport && (
          <Notice tone="warning" title="Problem reported">
            {d.problemReport}
          </Notice>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Section
            title="Customer"
            items={[
              { label: 'Name', value: customer.name || d.customerName },
              { label: 'Phone', value: customer.phone || d.pickup?.phoneNumber },
              { label: 'Email', value: customer.email || d.customerEmail, wide: true },
              ...(customer.userId ? [{ label: 'Profile', value: <Link className="text-brand-700 underline" to={`/admin/user/${encodeURIComponent(customer.userId)}`}>Open customer</Link> }] : []),
            ]}
          />
          <Section
            title="Rider"
            items={
              rider
                ? [
                    { label: 'Name', value: rider.name },
                    { label: 'Phone', value: rider.phone },
                    { label: 'Vehicle', value: [humanize(rider.vehicleType), rider.vehicle].filter(Boolean).join(' · ') },
                    { label: 'Plate number', value: rider.plateNumber },
                    ...(rider.driverProfileId
                      ? [{ label: 'Profile', value: <Link className="text-brand-700 underline" to={`/admin/driver/${encodeURIComponent(rider.driverProfileId)}`}>Open rider</Link> }]
                      : []),
                  ]
                : [{ label: 'Rider', value: 'No rider yet', wide: true }]
            }
          />
        </div>

        <Section
          title="Route"
          items={[
            { label: 'Pickup', value: d.pickup?.address, wide: true },
            { label: 'Sender', value: [d.pickup?.customerName, d.pickup?.phoneNumber].filter(Boolean).join(' · ') },
            { label: 'Pickup landmark', value: d.pickupLandmark },
            { label: 'Drop-off', value: d.destination?.address, wide: true },
            { label: 'Recipient', value: [d.destination?.recipientName, d.destination?.phoneNumber].filter(Boolean).join(' · ') },
            { label: 'Drop-off landmark', value: d.dropoffLandmark },
            { label: 'Distance', value: d.distanceKm != null ? `${Number(d.distanceKm).toFixed(1)} km` : null },
            { label: 'Vehicle booked', value: humanize(d.vehicleType) },
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Section
            title="Parcel"
            items={[
              { label: 'Size', value: humanize(d.parcelSize) },
              { label: 'Fragile', value: yesNo(d.fragile) },
              { label: 'Description', value: d.parcelDescription, wide: true },
              { label: 'Item value', value: d.itemValueNgn ? formatNaira(d.itemValueNgn) : null },
              { label: 'Note for rider', value: d.riderNote, wide: true },
            ]}
          />
          <Section
            title="Payment"
            items={[
              { label: 'Method', value: pod ? 'Pay on delivery (in the app)' : 'Paid at booking' },
              { label: 'Paid', value: d.paid ? 'Yes' : 'Not yet' },
              { label: 'Delivery fee', value: formatNaira(d.deliveryFeeNgn) },
              { label: 'Service fee', value: formatNaira(d.serviceFeeNgn) },
              { label: 'Total', value: formatNaira(d.totalNgn) },
              { label: 'Amount received', value: d.amountPaidNgn != null ? formatNaira(d.amountPaidNgn) : null },
              { label: 'Rider earns', value: formatNaira(d.riderEarningsNgn) },
              { label: 'Refund', value: d.refundStatus && d.refundStatus !== 'NONE' ? humanize(d.refundStatus) : null },
              { label: 'Paystack reference', value: d.paystackReference, wide: true },
              { label: 'Cancel reason', value: d.cancelReason, wide: true },
            ].filter((i) => i.value !== null && i.value !== undefined && i.value !== '')}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Timeline">
            {Array.isArray(d.timeline) && d.timeline.length ? (
              <ol className="space-y-3">
                {d.timeline.map((t, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-700" />
                    <div>
                      <p className="text-sm font-medium text-stone-900">{t.label}</p>
                      <p className="tabular text-xs text-stone-500">{formatDate(t.at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-stone-500">Nothing yet.</p>
            )}
          </Section>
          <Section title="Proof of delivery">
            {d.proofPhotoUrl ? (
              <a href={d.proofPhotoUrl} target="_blank" rel="noreferrer">
                <img src={d.proofPhotoUrl} alt="Parcel at drop-off" className="max-h-80 w-full rounded-xl object-cover ring-1 ring-stone-200" />
              </a>
            ) : (
              <p className="text-sm text-stone-500">No photo yet. The rider takes one at drop-off.</p>
            )}
            <div className="mt-4">
              <DetailList
                items={[
                  { label: 'Received by', value: d.receivedBy },
                  { label: 'Rating', value: d.rating ? `${d.rating} / 5` : null },
                  { label: 'Customer comment', value: d.ratingComment, wide: true },
                ]}
              />
            </div>
          </Section>
        </div>
      </div>
    </>
  );
};

export default DeliveryDetail;
