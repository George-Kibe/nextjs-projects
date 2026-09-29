"use client";

import { useEffect, useState } from "react";
import type { Borehole } from "@/lib/validation";
import BoreholeMap from "./BoreholeMap";

export default function MapView() {
  const [state, setState] = useState<{ items?: Borehole[]; total?: number; error?: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/boreholes?all=1", { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Failed to load boreholes");
        setState({ items: body.items, total: body.total });
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setState({ error: err.message });
      });
    return () => controller.abort();
  }, []);

  if (state?.error) return <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>;

  return (
    <div className="space-y-2">
      <p className="muted text-sm">
        {state?.items ? `${state.items.length} of ${state.total} boreholes shown` : "Loading…"}
      </p>
      <BoreholeMap boreholes={state?.items ?? []} />
    </div>
  );
}
