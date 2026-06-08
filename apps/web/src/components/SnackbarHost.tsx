import React, { useEffect, useMemo, useState } from "react";

type SnackbarStatus = "success" | "error" | "info" | "warning";

export type SnackbarEventDetail = {
  id?: string;
  title?: string;
  description?: string;
  status: SnackbarStatus;
  duration?: number;
};

type SnackbarItem = Required<Pick<SnackbarEventDetail, "id" | "status">> &
  Omit<SnackbarEventDetail, "id" | "status"> & {
    status: SnackbarStatus;
    createdAt: number;
  };

const EVENT_NAME = "urbis-snackbar";

export const SnackbarHost: React.FC = () => {
  const [items, setItems] = useState<SnackbarItem[]>([]);

  const palette = useMemo(
    () => ({
      success: {
        ring: "ring-emerald-500/30",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        text: "text-emerald-700 dark:text-emerald-200",
      },
      error: {
        ring: "ring-red-500/30",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        text: "text-red-700 dark:text-red-200",
      },
      warning: {
        ring: "ring-amber-500/30",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        text: "text-amber-800 dark:text-amber-200",
      },
      info: {
        ring: "ring-sky-500/30",
        bg: "bg-sky-500/10",
        border: "border-sky-500/30",
        text: "text-sky-800 dark:text-sky-200",
      },
    }),
    []
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<SnackbarEventDetail>;
      const detail = customEvent.detail;

      const id = detail.id ?? globalThis.crypto?.randomUUID?.() ?? String(Date.now());
      const duration = detail.duration ?? 3000;

      const item: SnackbarItem = {
        id,
        status: detail.status,
        title: detail.title,
        description: detail.description,
        duration,
        createdAt: Date.now(),
      };

      setItems((prev) => [item, ...prev].slice(0, 5));

      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    };

    window.addEventListener(EVENT_NAME, handler as EventListener);
    return () => window.removeEventListener(EVENT_NAME, handler as EventListener);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[2000] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
      {items.map((item) => {
        const p = palette[item.status];
        return (
          <div
            key={item.id}
            className={`rounded-xl border p-4 shadow-lg backdrop-blur ${p.bg} ${p.border} ring-1 ${p.ring}`}
          >
            {(item.title || item.description) && (
              <div className="grid gap-1">
                {item.title && (
                  <div className={`text-sm font-semibold ${p.text}`}>{item.title}</div>
                )}
                {item.description && (
                  <div className={`text-sm opacity-90 ${p.text}`}>{item.description}</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const dispatchSnackbarEvent = (detail: SnackbarEventDetail) => {
  window.dispatchEvent(new CustomEvent<SnackbarEventDetail>(EVENT_NAME, { detail }));
};
