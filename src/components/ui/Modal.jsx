import { useEffect } from "react";
import { createPortal } from "react-dom";
import { PiX } from "react-icons/pi";
import Button from "./Button";

/** Modal - centred dialog; closes on Escape and backdrop click */
export default function Modal({ open, onClose, title, description, children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event) => event.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-lg";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative w-full ${width} rounded-2xl bg-white shadow-pop ring-1 ring-stone-200`}>
        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <div>
            <h2 className="text-base font-semibold text-stone-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="-mt-1 -mr-2">
            <PiX className="size-4" />
          </Button>
        </div>
        {children && <div className="px-6 pt-4">{children}</div>}
        {footer && <div className="mt-6 flex justify-end gap-2 rounded-b-2xl border-t border-stone-100 bg-stone-50/60 px-6 py-4">{footer}</div>}
        {!footer && <div className="h-6" />}
      </div>
    </div>,
    document.body
  );
}

/** ConfirmDialog - yes/no confirmation for destructive or irreversible actions */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Confirm", tone = "danger", loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
