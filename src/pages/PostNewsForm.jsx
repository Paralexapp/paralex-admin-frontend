import { useState } from 'react';
import { toast } from 'react-toastify';
import { PiNewspaper, PiTrash } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminDeleteNews, adminGetNews, adminPostNews, adminUploadMedia } from '../api/api';
import { getAdminProfile } from '../api/authHelper';
import { formatDate, toTimestamp } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Field, Input, Textarea } from '../components/ui/Form';
import Button from '../components/ui/Button';
import FileDrop from '../components/ui/FileDrop';
import { ConfirmDialog } from '../components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';

// The app shows one news feed (no sections), newest first.
const emptyForm = { title: '', content: '', imageUrl: '' };

export default function PostNewsForm() {
  const news = useAsync(adminGetNews);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    setDeleting(true);
    try {
      await adminDeleteNews(toDelete.id);
      toast.success('Post deleted. It no longer shows in the app.');
      setToDelete(null);
      news.reload();
    } catch (err) {
      toast.error(err.error || "We couldn't delete this post. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

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
      // An uploaded picture wins over a pasted link.
      const imageUrl = imageFile ? await adminUploadMedia(imageFile) : form.imageUrl.trim() || null;
      await adminPostNews({
        title: form.title.trim(),
        content: form.content.trim(),
        imageUrl,
        publishedBy: getAdminProfile().email || 'Paralex Admin',
      });
      toast.success('Published. App users have been notified.');
      setForm(emptyForm);
      setImageFile(null);
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
              <Field label="Title" htmlFor="title" error={errors.title} required>
                <Input id="title" placeholder="A clear, specific headline" value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} />
              </Field>
              <Field label="Content" htmlFor="content" error={errors.content} required>
                <Textarea id="content" className="min-h-56" placeholder="Write the full post…" value={form.content} onChange={(e) => set('content', e.target.value)} error={errors.content} />
              </Field>
              <Field label="Picture" hint="Optional. Shown at the top of the post in the app.">
                <FileDrop file={imageFile} onChange={setImageFile} />
              </Field>
              {!imageFile && (
                <Field label="Or paste an image link" htmlFor="imageUrl" error={errors.imageUrl}>
                  <Input id="imageUrl" type="url" placeholder="https://…" value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} error={errors.imageUrl} />
                </Field>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-stone-100 px-6 py-4">
              <Button variant="secondary" onClick={() => { setForm(emptyForm); setImageFile(null); setErrors({}); }}>
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
                <li key={item.id} className="flex items-start gap-3 px-5 py-3.5">
                  {item.imageUrl && /^https?:/i.test(item.imageUrl) ? (
                    <img src={item.imageUrl} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-400"><PiNewspaper className="size-5" /></span>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="tabular text-xs text-stone-400">{formatDate(item.publishedDate)}</span>
                    <p className="line-clamp-2 text-sm font-medium text-stone-900">{item.title}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setToDelete(item)}
                    aria-label={`Delete ${item.title}`}
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <PiTrash className="size-4" />
                  </button>
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

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => !deleting && setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
        title="Delete this post?"
        description={toDelete ? `"${toDelete.title}" will disappear from the app's news feed. This can't be undone.` : ''}
        confirmLabel="Delete"
        tone="danger"
      />
    </>
  );
}
