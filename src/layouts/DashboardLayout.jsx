import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { ConfirmDialog } from "../components/ui/Modal";
import { logoutAdmin } from "../api/authHelper";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const navigate = useNavigate();

  const logout = () => {
    logoutAdmin();
    setConfirmLogout(false);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-dvh bg-stone-50">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-pop">
        Skip to content
      </a>

      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} onLogout={() => setConfirmLogout(true)} />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-brand-950/40 backdrop-blur-[2px] lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="lg:pl-64 print:pl-0">
        <Header toggleSidebar={() => setSidebarOpen((open) => !open)} onLogout={() => setConfirmLogout(true)} />
        <main id="main" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={logout}
        title="Log out?"
        description="You'll need to sign in again to use the dashboard."
        confirmLabel="Log out"
        tone="primary"
      />
    </div>
  );
};

export default DashboardLayout;
