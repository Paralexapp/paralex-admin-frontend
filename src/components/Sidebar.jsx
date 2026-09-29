import { Link, useLocation } from 'react-router-dom';
import { PiArrowSquareOut, PiSignOut, PiX } from 'react-icons/pi';
import logo from '../assets/logz.png';
import { navSections, isActive } from '../layouts/navigation';
import { getAdminProfile } from '../api/authHelper';
import Avatar from './ui/Avatar';

export default function Sidebar({ open, setOpen, onLogout }) {
  const { pathname } = useLocation();
  const admin = getAdminProfile();

  const linkClass = (active) =>
    `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition duration-200 ${
      active ? 'bg-white/10 text-white' : 'text-brand-200/80 hover:bg-white/5 hover:text-white'
    }`;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col print:hidden bg-brand-950 transition-transform duration-300 lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label="Main navigation"
    >
      {/* Soft brand glow so the panel isn't a flat slab */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top_left,rgb(127_58_132/0.45),transparent_65%)]" />

      <div className="relative flex h-16 items-center justify-between px-5">
        <Link to="/admin/dashboard" onClick={() => setOpen(false)}>
          <img src={logo} alt="Paralex" className="h-7 w-auto" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="inline-flex size-8 items-center justify-center rounded-lg text-brand-200 hover:bg-white/10 hover:text-white lg:hidden"
        >
          <PiX className="size-5" />
        </button>
      </div>

      <nav className="no-scrollbar relative flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="mb-1.5 px-3 text-[11px] font-medium tracking-wider text-brand-300/60 uppercase">{section.label}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item, pathname);
                return (
                  <li key={item.label}>
                    {item.external ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className={linkClass(false)}>
                        <Icon className="size-[18px]" />
                        <span className="flex-1">{item.label}</span>
                        <PiArrowSquareOut className="size-3.5 opacity-50" />
                      </a>
                    ) : (
                      <Link
                        to={item.to}
                        onClick={() => setOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={linkClass(active)}
                      >
                        <span className={`relative ${active ? 'text-white' : ''}`}>
                          <Icon className="size-[18px]" />
                        </span>
                        <span className="flex-1">{item.label}</span>
                        {active && <span className="size-1.5 rounded-full bg-accent-500" />}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="relative border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar name={admin.name} size="sm" className="!bg-white/10 !text-white" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{admin.name}</p>
            <p className="truncate text-xs text-brand-300/70">{admin.email || 'Administrator'}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Log out"
            title="Log out"
            className="inline-flex size-8 items-center justify-center rounded-lg text-brand-200 transition hover:bg-white/10 hover:text-white"
          >
            <PiSignOut className="size-[18px]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
