import { useEffect, useState } from 'react';
import { PiDownloadSimple } from 'react-icons/pi';

/**
 * "Install app" in the sidebar, shown only when this browser can install the dashboard
 * (Chrome/Edge on computers and Android) and it isn't installed already. On iPhone, Safari has
 * no install prompt: Share → Add to Home Screen does the same.
 */
export default function InstallAppButton() {
  const [prompt, setPrompt] = useState(null);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setPrompt(e);
    };
    const onInstalled = () => setPrompt(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!prompt) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        prompt.prompt();
        try { await prompt.userChoice; } catch { /* closed */ }
        setPrompt(null);
      }}
      className="mb-2 flex w-full items-center gap-3 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
    >
      <PiDownloadSimple className="size-[18px]" />
      Install Paralex Admin
    </button>
  );
}
