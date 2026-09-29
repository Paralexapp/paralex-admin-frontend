import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PiCheck, PiDownloadSimple, PiX, PiScales } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminApproveBailBond, adminGetBailBonds, adminRejectBailBond } from '../api/api';
import { formatDate, formatNaira } from '../utils/format';
import { bailBondStatus, statusTone } from '../utils/status';
import { bailBondSections } from '../utils/bailBondSections';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import DetailList from '../components/ui/DetailList';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';

// There is no "get one bail bond" endpoint, so load the admin list and pick the requested id.
const loadBond = async (id) => {
  const list = await adminGetBailBonds();
  return (Array.isArray(list) ? list : []).find((bond) => bond.id === id) || null;
};

function Section({ title, groups }) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="space-y-6 p-6">
        {groups.map((group, index) => (
          <div key={index} className={index ? 'border-t border-stone-100 pt-6' : ''}>
            {group.heading && <p className="mb-3 text-xs font-medium text-stone-500">{group.heading}</p>}
            <DetailList items={group.items} />
          </div>
        ))}
      </div>
    </Card>
  );
}

const BailBondDetail = () => {
  const { id } = useParams();
  const { data: bond, loading, error, reload } = useAsync(() => loadBond(id), [id]);
  const [confirm, setConfirm] = useState(null); // "approve" | "reject"
  const [working, setWorking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const back = { to: '/admin/bailbond', label: 'All bail bonds' };

  if (error) {
    return (
      <>
        <PageHeader title="Bail bond request" back={back} />
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      </>
    );
  }

  if (!loading && !bond) {
    return (
      <>
        <PageHeader title="Bail bond request" back={back} />
        <Card>
          <EmptyState icon={PiScales} title="Request not found" description="It may have been removed, or the link is wrong." />
        </Card>
      </>
    );
  }

  const status = bond ? bailBondStatus(bond) : null;
  const canDecide = status === 'Pending';

  const download = async () => {
    setDownloading(true);
    try {
      // Loaded on demand: the PDF library is only needed for this button
      const { downloadBailBondPdf } = await import('../utils/bailBondPdf');
      await downloadBailBondPdf(bond);
    } catch {
      toast.error("We couldn't create the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const decide = async () => {
    setWorking(true);
    try {
      if (confirm === 'approve') {
        await adminApproveBailBond(bond.id);
        toast.success('Request approved. The applicant has been sent a payment link.');
      } else {
        await adminRejectBailBond(bond.id);
        toast.success('Request rejected. The applicant has been notified.');
      }
      setConfirm(null);
      reload();
    } catch (err) {
      toast.error(err.error || `We couldn't ${confirm} this request. Please try again.`);
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <PageHeader
        title={loading ? 'Bail bond request' : bond.fullName || 'Bail bond request'}
        description={loading ? null : `Request #${String(bond.id).slice(-8)} · submitted ${formatDate(bond.time)}`}
        back={back}
        actions={
          !loading && (
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button variant="secondary" icon={PiDownloadSimple} onClick={download} loading={downloading}>
                Download PDF
              </Button>
              {canDecide && (
                <>
                  <Button variant="danger-ghost" icon={PiX} onClick={() => setConfirm('reject')}>
                    Reject
                  </Button>
                  <Button icon={PiCheck} onClick={() => setConfirm('approve')}>
                    Approve
                  </Button>
                </>
              )}
            </div>
          )
        }
      />

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary strip */}
          <Card className="grid gap-px overflow-hidden bg-stone-100 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Status', value: <Badge tone={statusTone[status]} dot>{status}</Badge> },
              { label: 'Bond amount', value: <span className="tabular text-lg font-semibold">{formatNaira(bond.totalAmount)}</span> },
              { label: 'Service fee', value: <span className="tabular text-lg font-semibold">{formatNaira(bond.feeCharged)}</span> },
              { label: 'Payment', value: bond.paid ? <Badge tone="success">Paid</Badge> : <Badge>Not paid</Badge> },
            ].map((item) => (
              <div key={item.label} className="bg-white px-5 py-4">
                <p className="text-xs font-medium text-stone-500">{item.label}</p>
                <div className="mt-1.5 text-stone-900">{item.value}</div>
              </div>
            ))}
          </Card>

          {!canDecide && (
            <p className="rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-600 print:hidden">
              This request is <span className="font-medium">{status.toLowerCase()}</span>, so it can no longer be approved or rejected.
            </p>
          )}

          <div className="grid items-start gap-6 lg:grid-cols-2">
            {bailBondSections(bond).map((section) => (
              <Section key={section.title} title={section.title} groups={section.groups} />
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => !working && setConfirm(null)}
        onConfirm={decide}
        loading={working}
        title={confirm === 'approve' ? 'Approve this bail bond?' : 'Reject this bail bond?'}
        description={
          confirm === 'approve'
            ? `${bond?.fullName || 'The applicant'} will be sent a payment link for this bond. This can't be undone.`
            : `${bond?.fullName || 'The applicant'} will be told their request was declined. This can't be undone.`
        }
        confirmLabel={confirm === 'approve' ? 'Approve and send payment link' : 'Reject request'}
        tone={confirm === 'approve' ? 'primary' : 'danger'}
      />
    </>
  );
};

export default BailBondDetail;
