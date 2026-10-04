"use client";

import { useEffect, useState } from "react";
import { KINDS, type KindKey } from "@/lib/kinds";
import type { Site } from "@/lib/validation";
import SiteMap from "./SiteMap";

export default function MapView({ kind }: { kind: KindKey }) {
  const { plural } = KINDS[kind];
  const [state, setState] = useState<{ kind: KindKey; items?: Site[]; total?: number; error?: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/${kind}?all=1`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? `Failed to load ${plural}`);
        setState({ kind, items: body.items, total: body.total });
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setState({ kind, error: err.message });
      });
    return () => controller.abort();
  }, [kind, plural]);

  // Ignore results still showing from the previously selected kind.
  const current = state?.kind === kind ? state : null;
  if (current?.error) return <p className="text-sm text-red-600 dark:text-red-400">{current.error}</p>;

  return (
    <div className="space-y-2">
      <p className="muted text-sm">
        {current?.items ? `${current.items.length} of ${current.total} ${plural} shown` : "Loading…"}
      </p>
      <SiteMap kind={kind} sites={current?.items ?? []} />
    </div>
  );
}
