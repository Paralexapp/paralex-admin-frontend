import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PiBell, PiList, PiGearSix, PiSignOut, PiCaretDown } from 'react-icons/pi';
import { adminGetNotifications } from '../api/api';
import { getAdminProfile } from '../api/authHelper';
import { titleFor } from '../layouts/navigation';
import Avatar from './ui/Avatar';

export default function Header({ toggleSidebar, onLogout }) {
  const { pathname } = useLocation();
  const admin = getAdminProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef(null);

  // Unread badge; failures are non-fatal here (the notifications page reports them)
  useEffect(() => {
    adminGetNotifications()
      .then((list) => setUnread(Array.isArray(list) ? list.filter((n) => !n.readInbox).length : 0))
      .catch(() => setUnread(0));
  }, []);

  // Close the profile menu on outside click / navigation
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event) => !menuRef.current?.contains(event.target) && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header className="print:hidden sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-stone-200/70 bg-white/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Open menu"
        className="-ml-1 inline-flex size-9 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 lg:hidden"
      >
        <PiList className="size-5" />
      </button>

      <p className="truncate text-sm font-medium text-stone-500">
        <span className="hidden sm:inline">Paralex Admin</span>
        <span className="mx-2 hidden text-stone-300 sm:inline">/</span>
        <span className="text-stone-900">{titleFor(pathname)}</span>
      </p>

      <div className="ml-auto flex items-center gap-1.5">
        <Link
          to="/admin/notifications"
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          className="relative inline-flex size-9 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
        >
          <PiBell className="size-5" />
          {unread > 0 && (
            <span className="tabular absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-lg py-1 pr-2 pl-1 transition hover:bg-stone-100"
          >
            <Avatar name={admin.name} size="sm" />
            <span className="hidden text-sm font-medium text-stone-700 sm:block">{admin.name}</span>
            <PiCaretDown className="hidden size-3.5 text-stone-400 sm:block" />
          </button>

          {menuOpen && (
            <div role="menu" className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl bg-white p-1.5 shadow-pop ring-1 ring-stone-200">
              <div className="px-3 py-2.5">
                <p className="text-sm font-medium text-stone-900">{admin.name}</p>
                <p className="truncate text-xs text-stone-500">{admin.email || 'Administrator'}</p>
              </div>
              <div className="my-1 h-px bg-stone-100" />
              <Link to="/admin/settings" role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">
                <PiGearSix className="size-4 text-stone-400" /> Admin settings
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={onLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-stone-100"
              >
                <PiSignOut className="size-4 text-stone-400" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
