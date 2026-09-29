import { useState } from 'react';
import { toast } from 'react-toastify';
import { PiNewspaper, PiScales, PiBank, PiCoins } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminGetNews, adminPostNews } from '../api/api';
import { getAdminProfile } from '../api/authHelper';
import { formatDate, humanize, toTimestamp } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Field, Input, Textarea } from '../components/ui/Form';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';

// Must match the backend's NewsSection enum
const sections = [
  { value: 'CRIMINAL', label: 'Criminal', icon: PiScales, description: 'Criminal law and court updates' },
  { value: 'FINANCE', label: 'Finance', icon: PiCoins, description: 'Financial and commercial news' },
  { value: 'GOVERNMENT', label: 'Government', icon: PiBank, description: 'Policy and government notices' },
];

const emptyForm = { section: 'CRIMINAL', title: '', content: '', imageUrl: '' };

export default function PostNewsForm() {
  const news = useAsync(adminGetNews);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (e) => {
    e.preventDefault();
    const found = {};
    if (!form.title.trim()) found.title = 'Add a title.';
    if (!form.content.trim()) found.content = 'Write the post content.';
    if (form.imageUrl && !/^https?:\/\/\S+$/i.test(form.imageUrl.trim())) found.imageUrl = 'Enter a full link starting with https://';
    setErrors(found);
    if (!Object.keys(found).length) setConfirm(true);
  };

  const publish = async () => {
    setPublishing(true);
    try {
      await adminPostNews({
        section: form.section,
        title: form.title.trim(),
        content: form.content.trim(),
        imageUrl: form.imageUrl.trim() || null,
        publishedBy: getAdminProfile().email || 'Paralex Admin',
      });
      toast.success('Published. App users have been notified.');
      setForm(emptyForm);
      setConfirm(false);
      news.reload();
    } catch (err) {
      toast.error(err.error || "We couldn't publish this post. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  const published = (Array.isArray(news.data) ? news.data : []).slice().sort((a, b) => toTimestamp(b.publishedDate) - toTimestamp(a.publishedDate));

  return (
    <>
      <PageHeader title="Post news" description="Publish an update to the news feed in the Paralex app." />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <form onSubmit={validate} noValidate className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="New post" />
            <div className="space-y-5 p-6">
              <Field label="Section" required>
                <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Section">
                  {sections.map(({ value, label, icon: Icon, description }) => {
                    const selected = form.section === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => set('section', value)}
                        className={`flex items-start gap-3 rounded-xl p-3 text-left ring-1 ring-inset transition ${
                          selected ? 'bg-brand-50 ring-brand-300' : 'ring-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-brand-900 text-white' : 'bg-stone-100 text-stone-500'}`}>
                          <Icon className="size-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-medium text-stone-900">{label}</span>
                          <span className="block text-xs text-stone-500">{description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Title" htmlFor="title" error={errors.title} required>
                <Input id="title" placeholder="A clear, specific headline" value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} />
              </Field>
              <Field label="Content" htmlFor="content" error={errors.content} required>
                <Textarea id="content" className="min-h-56" placeholder="Write the full post…" value={form.content} onChange={(e) => set('content', e.target.value)} error={errors.content} />
              </Field>
              <Field label="Image link" htmlFor="imageUrl" error={errors.imageUrl} hint="Optional. Paste a link to an image that's already online.">
                <Input id="imageUrl" type="url" placeholder="https://…" value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} error={errors.imageUrl} />
              </Field>
            </div>
            <div className="flex justify-end gap-2 border-t border-stone-100 px-6 py-4">
              <Button variant="secondary" onClick={() => { setForm(emptyForm); setErrors({}); }}>
                Clear
              </Button>
              <Button type="submit">Publish</Button>
            </div>
          </Card>
        </form>

        <Card className="overflow-hidden">
          <CardHeader title="Published" description={news.loading ? null : `${published.length} post${published.length === 1 ? '' : 's'}`} />
          {news.loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : news.error ? (
            <ErrorState message={news.error} onRetry={news.reload} className="py-10" />
          ) : published.length ? (
            <ul className="max-h-[36rem] divide-y divide-stone-100 overflow-y-auto">
              {published.map((item) => (
                <li key={item.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone="brand">{humanize(item.section)}</Badge>
                    <span className="tabular text-xs text-stone-400">{formatDate(item.publishedDate)}</span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm font-medium text-stone-900">{item.title}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={PiNewspaper} title="Nothing published yet" description="Your first post will show up here." className="py-10" />
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => !publishing && setConfirm(false)}
        onConfirm={publish}
        loading={publishing}
        title="Publish this post?"
        description="It goes live in the app straight away and every app user gets a notification."
        confirmLabel="Publish"
        tone="primary"
      />
    </>
  );
}
