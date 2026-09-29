import { useState } from 'react';
import { PiArrowsLeftRight, PiReceipt } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminGetPayments, adminGetTransactionRequests } from '../api/api';
import { formatDate, formatNaira, humanize, toTimestamp } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';

// Paystack reports amounts in kobo
const fromKobo = (amount) => (typeof amount === 'number' ? amount / 100 : null);

const paymentTone = (status) => (status === 'success' ? 'success' : status === 'failed' || status === 'abandoned' ? 'danger' : 'warning');

const paymentColumns = [
  {
    key: 'reference',
    header: 'Reference',
    sortValue: (p) => p.transactionReference || '',
    render: (p) => <span className="tabular font-medium text-stone-900">{p.transactionReference || '—'}</span>,
  },
  { key: 'for', header: 'For', render: (p) => humanize(p.target) },
  {
    key: 'amount',
    header: 'Amount',
    className: 'text-right',
    sortValue: (p) => p.gatewayResponse?.amount || 0,
    render: (p) => <span className="tabular font-medium text-stone-900">{formatNaira(fromKobo(p.gatewayResponse?.amount))}</span>,
  },
  { key: 'channel', header: 'Channel', render: (p) => humanize(p.gatewayResponse?.channel), mobileHidden: true },
  {
    key: 'status',
    header: 'Status',
    sortValue: (p) => p.gatewayResponse?.status || '',
    render: (p) => <Badge tone={paymentTone(p.gatewayResponse?.status)} dot>{humanize(p.gatewayResponse?.status || 'unknown')}</Badge>,
  },
  { key: 'date', header: 'Date', sortValue: (p) => toTimestamp(p.time), render: (p) => <span className="tabular text-stone-500">{formatDate(p.time)}</span> },
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
  const payments = useAsync(adminGetPayments);
  const requests = useAsync(adminGetTransactionRequests);

  return (
    <>
      <PageHeader title="Transactions" description="Payments made on Paralex, and legal transaction requests from users." />

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
          searchText={(p) => `${p.transactionReference || ''} ${p.target || ''} ${p.gatewayResponse?.status || ''}`}
          searchPlaceholder="Search by reference"
          initialSort={{ key: 'date', dir: 'desc' }}
          empty={{ icon: PiReceipt, title: 'No payments yet', description: 'Card payments made through Paystack will appear here.' }}
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
