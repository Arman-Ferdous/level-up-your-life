export default function ToastStack({ toasts, onClose }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((toast) => {
        const toneClasses =
          toast.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : toast.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-900"
              : "border-sky-200 bg-sky-50 text-sky-900";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-sm transition ${toneClasses}`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium leading-5">{toast.message}</p>
              <button
                type="button"
                onClick={() => onClose(toast.id)}
                className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold opacity-80 transition hover:opacity-100"
                aria-label="Close notification"
              >
                Close
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
