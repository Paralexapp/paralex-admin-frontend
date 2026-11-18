import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { PiArrowCounterClockwise, PiChatCircle, PiEye, PiFlag, PiHeart, PiTrash, PiUsersThree } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import {
  adminGetNetworkComments,
  adminGetNetworkPosts,
  adminRemoveNetworkComment,
  adminRemoveNetworkPost,
  adminRestoreNetworkPost,
} from '../api/api';
import { formatDate, toTimestamp } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Field, Textarea } from '../components/ui/Form';

const TABS = [
  { value: 'ALL', label: 'Live posts' },
  { value: 'REPORTED', label: 'Reported' },
  { value: 'REMOVED', label: 'Removed' },
];

const isHttps = (u) => typeof u === 'string' && /^https:/i.test(u);

/**
 * Posts lawyers share in the app's lawyer network (lawyers only; never in general news). Posts go
 * up straight away; remove any that break the rules. The lawyer is told the reason.
 */
export default function NetworkPosts() {
  const [tab, setTab] = useState('ALL');
  const load = useCallback(() => adminGetNetworkPosts(tab), [tab]);
  const { data, loading, error, reload } = useAsync(load, [tab]);

  const [viewing, setViewing] = useState(null); // post
  const [comments, setComments] = useState(null);
  const [removing, setRemoving] = useState(null); // { kind: 'post' | 'comment', item }
  const [reason, setReason] = useState('');
  const [working, setWorking] = useState(false);

  const openPost = async (post) => {
    setViewing(post);
    setComments(null);
    try {
      const list = await adminGetNetworkComments(post.id);
      setComments(Array.isArray(list) ? list : []);
    } catch (err) {
      setComments([]);
      toast.error(err.error || "Couldn't load the comments.");
    }
  };

  const askRemove = (kind, item) => {
    setRemoving({ kind, item });
    setReason('');
  };

  const remove = async () => {
    if (!reason.trim()) {
      toast.error('Give a reason. The lawyer will see it.');
      return;
    }
    setWorking(true);
    try {
      if (removing.kind === 'post') {
        await adminRemoveNetworkPost(removing.item.id, reason.trim());
        toast.success('Post removed. The lawyer has been told why.');
        setViewing(null);
        reload();
      } else {
        await adminRemoveNetworkComment(removing.item.id, reason.trim());
        toast.success('Comment removed. Its writer has been told why.');
        setComments((list) => (list || []).map((c) => (c.id === removing.item.id ? { ...c, removed: true, removedReason: reason.trim() } : c)));
        reload();
      }
      setRemoving(null);
    } catch (err) {
      toast.error(err.error || "We couldn't remove it. Please try again.");
    } finally {
      setWorking(false);
    }
  };

  const restore = async (post) => {
    try {
      await adminRestoreNetworkPost(post.id);
      toast.success('Post restored');
      setViewing(null);
      reload();
    } catch (err) {
      toast.error(err.error || "We couldn't restore it.");
    }
  };

  const columns = [
    {
      key: 'author',
      header: 'Lawyer',
      sortValue: (r) => (r.author?.name || '').toLowerCase(),
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.author?.name} src={isHttps(r.author?.photoUrl) ? r.author.photoUrl : undefined} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-stone-900">{r.author?.name || 'Lawyer'}</p>
            {r.author?.verified && <p className="text-xs text-stone-500">Verified</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'post',
      header: 'Post',
      render: (r) => (
        <div className="max-w-md">
          {r.title && <p className="truncate font-medium text-stone-900">{r.title}</p>}
          <p className="line-clamp-2 text-sm text-stone-600">{r.text}</p>
          {r.photos?.length > 0 && <p className="mt-0.5 text-xs text-stone-400">{r.photos.length} photo{r.photos.length > 1 ? 's' : ''}</p>}
          {r.removed && r.removedReason && <p className="mt-1 text-xs text-red-700">Removed: {r.removedReason}</p>}
          {r.removed && !r.removedByAdmin && <p className="mt-1 text-xs text-stone-500">Deleted by the lawyer</p>}
        </div>
      ),
    },
    {
      key: 'activity',
      header: 'Activity',
      mobileHidden: true,
      sortValue: (r) => (r.likes || 0) + (r.comments || 0),
      render: (r) => (
        <div className="flex items-center gap-3 text-sm text-stone-600 tabular">
          <span className="flex items-center gap-1"><PiHeart className="size-4" />{r.likes || 0}</span>
          <span className="flex items-center gap-1"><PiChatCircle className="size-4" />{r.comments || 0}</span>
        </div>
      ),
    },
    {
      key: 'reports',
      header: 'Reports',
      sortValue: (r) => r.reports || 0,
      render: (r) => (r.reports ? <Badge tone="danger" dot>{r.reports}</Badge> : <span className="text-stone-400">—</span>),
    },
    {
      key: 'when',
      header: 'Posted',
      mobileHidden: true,
      sortValue: (r) => toTimestamp(r.createdAt),
      render: (r) => <span className="tabular text-stone-500">{formatDate(r.createdAt) || '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" icon={PiEye} onClick={(e) => { e.stopPropagation(); openPost(r); }}>View</Button>
          {!r.removed && (
            <Button size="sm" variant="danger" icon={PiTrash} onClick={(e) => { e.stopPropagation(); askRemove('post', r); }}>Remove</Button>
          )}
          {r.removed && r.removedByAdmin && (
            <Button size="sm" variant="secondary" icon={PiArrowCounterClockwise} onClick={(e) => { e.stopPropagation(); restore(r); }}>Restore</Button>
          )}
        </div>
      ),
    },
  ];

  const rows = Array.isArray(data) ? data : [];

  return (
    <>
      <PageHeader
        title="Network posts"
        description="What lawyers share with each other in the app. Only lawyers see these. Remove anything that breaks the rules; the lawyer is told why."
      />

      <div className="mb-4 flex gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${tab === t.value ? 'bg-brand-900 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={openPost}
        getRowKey={(r) => r.id}
        searchText={(r) => `${r.author?.name || ''} ${r.title || ''} ${r.text || ''}`}
        searchPlaceholder="Search by lawyer or words in the post"
        initialSort={tab === 'REPORTED' ? { key: 'reports', dir: 'desc' } : { key: 'when', dir: 'desc' }}
        empty={{
          icon: tab === 'REPORTED' ? PiFlag : PiUsersThree,
          title: tab === 'REPORTED' ? 'Nothing reported' : tab === 'REMOVED' ? 'Nothing removed' : 'No posts yet',
          description: tab === 'ALL' ? 'Posts appear here as soon as lawyers share them in the app.' : '',
        }}
      />

      {/* One post with its comments */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        size="lg"
        title={viewing?.title || `Post by ${viewing?.author?.name || 'a lawyer'}`}
        description={`${viewing?.author?.name || 'Lawyer'} · ${formatDate(viewing?.createdAt) || ''} · ${viewing?.likes || 0} likes · ${viewing?.reports || 0} reports`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>
            {viewing && !viewing.removed && (
              <Button variant="danger" icon={PiTrash} onClick={() => askRemove('post', viewing)}>Remove post</Button>
            )}
            {viewing?.removed && viewing?.removedByAdmin && (
              <Button icon={PiArrowCounterClockwise} onClick={() => restore(viewing)}>Restore</Button>
            )}
          </>
        }
      >
        <div className="max-h-[60vh] space-y-4 overflow-y-auto">
          <p className="whitespace-pre-wrap text-sm text-stone-800">{viewing?.text}</p>
          {viewing?.photos?.filter(isHttps).length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {viewing.photos.filter(isHttps).map((u) => (
                <a key={u} href={u} target="_blank" rel="noopener noreferrer">
                  <img src={u} alt="" className="aspect-square w-full rounded-lg object-cover ring-1 ring-stone-200" />
                </a>
              ))}
            </div>
          )}
          {viewing?.removedReason && <p className="text-sm text-red-700">Removed: {viewing.removedReason}</p>}

          <div>
            <p className="mb-2 text-sm font-semibold text-stone-900">Comments</p>
            {comments === null && <p className="text-sm text-stone-500">Loading…</p>}
            {comments?.length === 0 && <p className="text-sm text-stone-500">No comments.</p>}
            <ul className="space-y-2">
              {comments?.map((c) => (
                <li key={c.id} className={`flex items-start gap-3 rounded-lg p-3 ring-1 ring-stone-200 ${c.removed ? 'bg-stone-50 opacity-70' : 'bg-white'}`}>
                  <Avatar name={c.author?.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-900">
                      {c.author?.name || 'Lawyer'} <span className="font-normal text-stone-400">· {formatDate(c.createdAt)}</span>
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-stone-700">{c.text}</p>
                    {c.removed && <p className="mt-1 text-xs text-red-700">Removed{c.removedReason ? `: ${c.removedReason}` : ' by the writer or post author'}</p>}
                  </div>
                  {!c.removed && (
                    <Button size="sm" variant="secondary" icon={PiTrash} onClick={() => askRemove('comment', c)}>Remove</Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Modal>

      {/* Reason for removing */}
      <Modal
        open={!!removing}
        onClose={() => !working && setRemoving(null)}
        title={removing?.kind === 'post' ? 'Remove this post?' : 'Remove this comment?'}
        description="It disappears for every lawyer. The writer gets a notification with your reason."
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoving(null)} disabled={working}>Cancel</Button>
            <Button variant="danger" onClick={remove} loading={working}>Remove</Button>
          </>
        }
      >
        <Field label="Reason (they will see this)" htmlFor="remove-reason">
          <Textarea
            id="remove-reason"
            className="min-h-24"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Advertising is not allowed in the lawyer network"
          />
        </Field>
      </Modal>
    </>
  );
}
