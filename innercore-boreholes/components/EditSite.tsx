"use client";

import type { KindKey } from "@/lib/kinds";
import SiteForm from "./SiteForm";
import { useSite } from "./useSite";

export default function EditSite({ kind, id }: { kind: KindKey; id: string }) {
  const { site, error, loading } = useSite(kind, id);
  if (loading) return <p className="muted text-sm">Loading…</p>;
  if (error || !site) return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  return <SiteForm kind={kind} site={site} />;
}
