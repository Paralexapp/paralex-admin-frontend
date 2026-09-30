import { useState } from 'react';
import { PiArrowsLeftRight, PiReceipt } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminGetPaymentLedger, adminGetTransactionRequests } from '../api/api';
import { formatDate, formatNaira, humanize, toTimestamp } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';

// The ledger already converts Paystack's kobo to naira
const paymentTypes = {
  DELIVERY: { label: 'Delivery', tone: 'brand' },
  BAIL_BOND: { label: 'Bail bond', tone: 'warning' },
  LITIGATION_SUPPORT: { label: 'Legal support', tone: 'neutral' },
};

const paymentColumns = [
  {
    key: 'reference',
    header: 'Reference',
    sortValue: (p) => p.reference || '',
    render: (p) => (
      <div className="min-w-0">
        <p className="tabular truncate font-medium text-stone-900">{p.reference || '—'}</p>
        {p.description && <p className="max-w-xs truncate text-xs text-stone-500">{p.description}</p>}
      </div>
    ),
  },
  {
    key: 'type',
    header: 'Type',
    sortValue: (p) => p.type || '',
    render: (p) => {
      const type = paymentTypes[p.type] || { label: humanize(p.type), tone: 'neutral' };
      return <Badge tone={type.tone}>{type.label}</Badge>;
    },
  },
  {
    key: 'amount',
    header: 'Amount',
    className: 'text-right',
    sortValue: (p) => Number(p.amount) || 0,
    render: (p) => (
      <span className="tabular font-medium text-stone-900" title={p.estimated ? 'Worked out from the bail amount; the exact paid figure was not recorded.' : undefined}>
        {formatNaira(p.amount)}
        {p.estimated && <span className="ml-1 text-xs font-normal text-stone-400">(est.)</span>}
      </span>
    ),
  },
  { key: 'customer', header: 'Customer', render: (p) => p.customerEmail || '—', mobileHidden: true },
  { key: 'channel', header: 'Channel', render: (p) => humanize(p.channel), mobileHidden: true },
  { key: 'date', header: 'Paid', sortValue: (p) => toTimestamp(p.paidAt), render: (p) => <span className="tabular text-stone-500">{formatDate(p.paidAt)}</span> },
];

const requestStatus = (r) => (r.suspended ? { label: 'Suspended', tone: 'danger' } : r.processed ? { label: 'Processed', tone: 'success' } : { label: 'Open', tone: 'warning' });

const requestColumns = [
  {
    key: 'service',
    header: 'Service',
    sortValue: (r) => r.transaction?.name || '',
    render: (r) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-stone-900">{r.transaction?.name || 'Transaction request'}</p>
        <p className="tabular truncate text-xs text-stone-500">{r.transactionReference || String(r.id || '').slice(-8)}</p>
      </div>
    ),
  },
  { key: 'paid', header: 'Amount paid', className: 'text-right', sortValue: (r) => r.amountPaid || 0, render: (r) => <span className="tabular font-medium text-stone-900">{formatNaira(r.amountPaid)}</span> },
  { key: 'docs', header: 'Submissions', render: (r) => (r.submissions?.length ? `${r.submissions.length} file(s)` : '—'), mobileHidden: true },
  {
    key: 'status',
    header: 'Status',
    sortValue: (r) => requestStatus(r).label,
    render: (r) => {
      const status = requestStatus(r);
      return <Badge tone={status.tone} dot>{status.label}</Badge>;
    },
  },
  { key: 'date', header: 'Date', sortValue: (r) => toTimestamp(r.time), render: (r) => <span className="tabular text-stone-500">{formatDate(r.time)}</span> },
];

const tabs = [
  { value: 'payments', label: 'Payments' },
  { value: 'requests', label: 'Transaction requests' },
];

const Transactions = () => {
  const [tab, setTab] = useState('payments');
  const payments = useAsync(adminGetPaymentLedger);
  const requests = useAsync(adminGetTransactionRequests);

  return (
    <>
      <PageHeader title="Transactions" description="Successful payments for deliveries, bail bonds and legal support, and legal transaction requests from users." />

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

      {tab === 'payments' ? (
        <DataTable
          key="payments"
          columns={paymentColumns}
          rows={Array.isArray(payments.data) ? payments.data : []}
          loading={payments.loading}
          error={payments.error}
          onRetry={payments.reload}
          searchText={(p) => `${p.reference || ''} ${p.customerEmail || ''} ${p.description || ''}`}
          searchPlaceholder="Search by reference or customer email"
          filters={[
            { label: 'All', value: 'all' },
            { label: 'Deliveries', value: 'DELIVERY', predicate: (p) => p.type === 'DELIVERY' },
            { label: 'Bail bonds', value: 'BAIL_BOND', predicate: (p) => p.type === 'BAIL_BOND' },
            { label: 'Legal support', value: 'LITIGATION_SUPPORT', predicate: (p) => p.type === 'LITIGATION_SUPPORT' },
          ]}
          initialSort={{ key: 'date', dir: 'desc' }}
          empty={{ icon: PiReceipt, title: 'No payments yet', description: 'Successful delivery, bail bond and legal support payments will appear here.' }}
        />
      ) : (
        <>
          <DataTable
            key="requests"
            columns={requestColumns}
            rows={Array.isArray(requests.data) ? requests.data : []}
            loading={requests.loading}
            error={requests.error}
            onRetry={requests.reload}
            searchText={(r) => `${r.transaction?.name || ''} ${r.transactionReference || ''}`}
            searchPlaceholder="Search by service or reference"
            filters={[
              { label: 'All', value: 'all' },
              { label: 'Open', value: 'open', predicate: (r) => requestStatus(r).label === 'Open' },
              { label: 'Processed', value: 'processed', predicate: (r) => r.processed },
              { label: 'Suspended', value: 'suspended', predicate: (r) => r.suspended },
            ]}
            initialSort={{ key: 'date', dir: 'desc' }}
            empty={{ icon: PiArrowsLeftRight, title: 'No transaction requests yet' }}
          />
        </>
      )}
    </>
  );
};

export default Transactions;
