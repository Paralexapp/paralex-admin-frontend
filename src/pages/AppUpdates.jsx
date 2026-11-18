import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { PiDeviceMobile, PiMegaphone } from 'react-icons/pi';
import { adminGetAppVersion, adminSetAppVersion } from '../api/api';
import { formatDate } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Field, Input, Textarea } from '../components/ui/Form';

const VERSION = /^\d{1,3}(\.\d{1,3}){0,3}$/;

/**
 * Tell the app a new version is out. Everyone on an older version is asked to update when they
 * open the app; anyone below the oldest allowed version must update before they can carry on.
 * Works on app 2.1.7 and newer; "Notify every phone" also reaches older versions.
 */
export default function AppUpdates() {
  const [current, setCurrent] = useState(null);
  const [latest, setLatest] = useState('');
  const [min, setMin] = useState('');
  const [message, setMessage] = useState('');
  const [notify, setNotify] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminGetAppVersion()
      .then((v) => {
        setCurrent(v || {});
        setLatest(v?.latestVersion || '');
        setMin(v?.minVersion || '');
        setMessage(v?.message || '');
      })
      .catch(() => setCurrent({}));
  }, []);

  const check = () => {
    if (!VERSION.test(latest.trim())) return toast.error('Enter the newest version like 2.1.7.');
    if (min.trim() && !VERSION.test(min.trim())) return toast.error('Enter the oldest allowed version like 2.1.5, or leave it empty.');
    setConfirming(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const v = await adminSetAppVersion({ latestVersion: latest.trim(), minVersion: min.trim() || null, message: message.trim() || null, notify });
      setCurrent(v);
      toast.success(notify ? 'Saved. Every phone is being notified.' : 'Saved. People are asked to update when they open the app.');
      setConfirming(false);
    } catch (err) {
      toast.error(err.error || "We couldn't save that. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="App updates"
        description="After a new version is live in both stores, set it here so everyone is asked to update."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Announce a version" description="Only do this once the version is live on Google Play and the App Store." />
          <div className="space-y-4 p-6 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Newest version" htmlFor="latest" hint="e.g. 2.1.7. Older apps are asked to update.">
                <Input id="latest" value={latest} onChange={(e) => setLatest(e.target.value)} placeholder="2.1.7" />
              </Field>
              <Field label="Oldest allowed (optional)" htmlFor="min" hint="Only for a critical fix: older apps can't be used until they update.">
                <Input id="min" value={min} onChange={(e) => setMin(e.target.value)} placeholder="Leave empty" />
              </Field>
            </div>
            <Field label="What's new (shown to users)" htmlFor="msg">
              <Textarea id="msg" className="min-h-24" maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Lawyers can now share posts with each other, and notifications ring while the app is open." />
            </Field>
            <label className="flex items-start gap-3 text-sm text-stone-700">
              <input type="checkbox" className="mt-0.5 size-4 accent-brand-900" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
              <span>
                <span className="font-medium text-stone-900">Notify every phone now</span>
                <br />Sends "Paralex {latest || 'x.y.z'} is out" to everyone, including people on older versions.
              </span>
            </label>
            <div className="flex justify-end">
              <Button icon={PiMegaphone} onClick={check}>Save</Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Right now" />
          <div className="space-y-3 p-6 pt-2 text-sm">
            {current === null ? (
              <p className="text-stone-500">Loading…</p>
            ) : (
              <>
                <p className="flex items-center gap-2"><PiDeviceMobile className="size-4 text-stone-400" />Newest: <span className="font-medium tabular">{current.latestVersion || 'Not set'}</span></p>
                <p>Oldest allowed: <span className="font-medium tabular">{current.minVersion || 'Any'}</span></p>
                {current.updatedAt && <p className="text-stone-500">Last changed {formatDate(current.updatedAt)}</p>}
              </>
            )}
          </div>
        </Card>
      </div>

      <Modal
        open={confirming}
        onClose={() => !saving && setConfirming(false)}
        title={`Announce version ${latest.trim()}?`}
        description={[
          `Everyone on an older version is asked to update when they open the app.`,
          min.trim() ? `Anyone below ${min.trim()} must update before they can use the app.` : '',
          notify ? 'Every phone gets a notification now. This can\'t be undone.' : '',
        ].filter(Boolean).join(' ')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} loading={saving}>{notify ? 'Save and notify' : 'Save'}</Button>
          </>
        }
      />
    </>
  );
}
