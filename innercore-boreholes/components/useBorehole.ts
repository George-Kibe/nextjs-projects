"use client";

import { useEffect, useState } from "react";
import type { Borehole } from "@/lib/validation";

/** Loads one borehole from the API. */
export function useBorehole(id: string) {
  const [state, setState] = useState<{ id: string; borehole?: Borehole; error?: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/boreholes/${id}`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Failed to load borehole");
        setState({ id, borehole: body });
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setState({ id, error: err.message });
      });
    return () => controller.abort();
  }, [id]);

  const current = state?.id === id ? state : null;
  return { borehole: current?.borehole, error: current?.error, loading: !current };
}
