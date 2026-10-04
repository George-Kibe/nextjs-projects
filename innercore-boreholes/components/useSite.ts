"use client";

import { useEffect, useState } from "react";
import { KINDS, type KindKey } from "@/lib/kinds";
import type { Site } from "@/lib/validation";

/** Loads one record of the given kind from the API. */
export function useSite(kind: KindKey, id: string) {
  const key = `${kind}/${id}`;
  const [state, setState] = useState<{ key: string; site?: Site; error?: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/${key}`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? `Failed to load ${KINDS[kind].singular}`);
        setState({ key, site: body });
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setState({ key, error: err.message });
      });
    return () => controller.abort();
  }, [kind, key]);

  const current = state?.key === key ? state : null;
  return { site: current?.site, error: current?.error, loading: !current };
}
