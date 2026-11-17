import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { PiBank, PiCheckCircle, PiPencilSimple } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminGetBanks, adminGetPayoutAccount, adminResolveAccount, adminUpdatePayoutAccount } from '../api/api';
import { Card, CardHeader } from './ui/Card';
import DetailList from './ui/DetailList';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { Field, Input, Select } from './ui/Form';
import { Skeleton } from './ui/States';

const masked = (value) => (value && value.length > 4 ? `••••${value.slice(-4)}` : value);
const digits = (value) => (value || '').replace(/\D/g, '');

/**
 * Payout account for a rider, lawyer or bailiff, with an admin edit form. The account number is
 * checked with the bank as soon as it's complete and the bank's own account name is shown and
 * saved; the person is notified of the change.
 */
export default function PayoutAccountCard({ userId, title = 'Payout account' }) {
  const account = useAsync(() => (userId ? adminGetPayoutAccount(userId) : Promise.resolve(null)), [userId]);
  const [editing, setEditing] = useState(false);
  const a = account.data;

  return (
    <Card>
      <CardHeader
        title={title}
        description="Where Paralex pays them. Numbers are partly hidden."
        actions={
          userId && !account.error ? (
            <Button variant="secondary" size="sm" icon={PiPencilSimple} onClick={() => setEditing(true)} disabled={account.loading}>
              {a?.accountNumber ? 'Change' : 'Add'}
            </Button>
          ) : null
        }
      />
      <div className="p-6">
        {account.loading ? (
          <Skeleton className="h-16" />
        ) : account.error ? (
          <p className="text-sm text-stone-500">{account.error}</p>
        ) : (
          <DetailList
            items={[
              { label: 'Bank', value: a?.bankName },
              { label: 'Account name', value: a?.accountName },
              { label: 'Account number', value: masked(a?.accountNumber) },
              { label: 'BVN', value: a?.bvnLast4 ? `••••${a.bvnLast4}` : null },
            ]}
          />
        )}
      </div>
      {editing && (
        <EditPayoutAccount
          userId={userId}
          current={a}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            account.reload();
          }}
        />
      )}
    </Card>
  );
}

function EditPayoutAccount({ userId, current, onClose, onSaved }) {
  const banks = useAsync(adminGetBanks);
  const [bankCode, setBankCode] = useState(current?.bankCode || '');
  const [filter, setFilter] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bvn, setBvn] = useState('');
  const [check, setCheck] = useState({ state: 'idle', name: '', message: '' }); // idle | checking | ok | error
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const latest = useRef(0);

  const list = Array.isArray(banks.data) ? banks.data : [];
  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? list.filter((b) => b.name.toLowerCase().includes(q)) : list;
  }, [list, filter]);
  const bank = list.find((b) => b.code === bankCode);

  // Check the account with the bank as soon as it's complete (10 digits and a bank chosen).
  useEffect(() => {
    const number = digits(accountNumber);
    if (!bankCode || number.length !== 10) {
      setCheck({ state: 'idle', name: '', message: '' });
      return;
    }
    const run = ++latest.current;
    setCheck({ state: 'checking', name: '', message: '' });
    adminResolveAccount(bankCode, number)
      .then((res) => run === latest.current && setCheck({ state: 'ok', name: res?.accountName || '', message: '' }))
      .catch((err) =>
        run === latest.current &&
        setCheck({ state: 'error', name: '', message: err?.error || "This account couldn't be found at the chosen bank." }),
      );
  }, [bankCode, accountNumber]);

  const bvnDigits = digits(bvn);
  const bvnError = bvn && bvnDigits.length !== 11 ? 'A BVN is 11 digits.' : '';
  const canSave = check.state === 'ok' && !bvnError && !saving;

  const save = async (e) => {
    e?.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      await adminUpdatePayoutAccount({
        userId,
        bankCode,
        bankName: bank?.name,
        accountNumber: digits(accountNumber),
        ...(bvnDigits ? { bvn: bvnDigits } : {}),
      });
      toast.success(`Payout account changed to ${bank?.name || 'the new bank'} ••${digits(accountNumber).slice(-4)}. They've been notified.`);
      onSaved();
    } catch (err) {
      setError(err?.error || "We couldn't save this account. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={() => !saving && onClose()}
      title="Change payout account"
      description="The account is checked with the bank and the bank's account name is saved. They'll get a notification about the change."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="payout-form" loading={saving} disabled={!canSave}>
            Save account
          </Button>
        </>
      }
    >
      <form id="payout-form" onSubmit={save} className="space-y-4" noValidate>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <Field
          label="Bank"
          htmlFor="bank"
          hint={banks.loading ? 'Loading banks…' : banks.error ? banks.error : `${list.length} Nigerian banks`}
        >
          <Input placeholder="Type to filter banks" value={filter} onChange={(e) => setFilter(e.target.value)} className="mb-2" />
          <Select id="bank" value={bankCode} onChange={(e) => setBankCode(e.target.value)} disabled={banks.loading || Boolean(banks.error)}>
            <option value="">Choose the bank</option>
            {shown.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Account number"
          htmlFor="accountNumber"
          error={check.state === 'error' ? check.message : null}
          hint={check.state === 'checking' ? 'Checking with the bank…' : 'Ten digits (NUBAN).'}
        >
          <Input
            id="accountNumber"
            inputMode="numeric"
            autoComplete="off"
            maxLength={14}
            placeholder="0123456789"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            icon={PiBank}
          />
        </Field>
        {check.state === 'ok' && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <PiCheckCircle className="size-4 shrink-0" />
            <span>
              Account name: <strong>{check.name}</strong>
            </span>
          </div>
        )}
        <Field
          label="BVN (optional)"
          htmlFor="bvn"
          error={bvnError || null}
          hint={current?.bvnLast4 ? `Current BVN ends in ${current.bvnLast4}. Leave empty to keep it.` : '11 digits.'}
        >
          <Input id="bvn" inputMode="numeric" autoComplete="off" maxLength={15} placeholder="22123456789" value={bvn} onChange={(e) => setBvn(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
