import { useState } from 'react';
import { PiBell, PiBellRinging } from 'react-icons/pi';
import useAsync from '../hooks/useAsync';
import { adminGetNotifications } from '../api/api';
import { formatDate, toTimestamp } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';

const PAGE = 10;

// Quoted names in messages ("Jane Doe") are highlighted
const highlight = (message = '') =>
  message.split('"').map((part, idx) =>
    idx % 2 === 1 ? (
      <span key={idx} className="font-medium text-stone-900">
        {part}
      </span>
    ) : (
      part
    )
  );

const NotificationPage = () => {
  const { data, loading, error, reload } = useAsync(adminGetNotifications);
  const [visible, setVisible] = useState(PAGE);
  const notifications = (Array.isArray(data) ? data : []).slice().sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));
  const unread = notifications.filter((n) => !n.readInbox).length;

  return (
    <>
      <PageHeader title="Notifications" description={loading ? null : unread ? `${unread} unread` : "You're all caught up."} />
      <Card className="overflow-hidden">
        {loading ? (
          <ul className="divide-y divide-stone-100">
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="flex gap-3 p-5">
                <Skeleton className="size-9 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </li>
            ))}
          </ul>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : notifications.length === 0 ? (
          <EmptyState icon={PiBell} title="No notifications" description="New registrations and bail bond submissions will show up here." />
        ) : (
          <>
            <ul className="divide-y divide-stone-100">
              {notifications.slice(0, visible).map((n) => (
                <li key={n.id} className={`flex gap-3 p-5 ${n.readInbox ? '' : 'bg-brand-50/40'}`}>
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${n.readInbox ? 'bg-stone-100 text-stone-500' : 'bg-brand-100 text-brand-800'}`}>
                    <PiBellRinging className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-stone-900">{n.title || 'Notification'}</p>
                      <span className="tabular shrink-0 text-xs text-stone-400">{formatDate(n.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-stone-600">{highlight(n.message)}</p>
                  </div>
                  {!n.readInbox && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent-500" aria-label="Unread" />}
                </li>
              ))}
            </ul>
            {visible < notifications.length && (
              <div className="border-t border-stone-100 p-4 text-center">
                <Button variant="secondary" size="sm" onClick={() => setVisible((v) => v + PAGE)}>
                  Show more
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </>
  );
};

export default NotificationPage;
