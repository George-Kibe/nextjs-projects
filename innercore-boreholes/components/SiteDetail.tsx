"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FIELDS, formatNumber } from "@/lib/fields";
import { extraFields, KINDS, viewHref, type KindKey } from "@/lib/kinds";
import { siteCode, type SiteFields } from "@/lib/validation";
import SiteMap from "./SiteMap";
import { useSite } from "./useSite";

const ROWS: (keyof SiteFields)[] = [
  "latitude", "longitude", "elevation", "depth", "yield", "formation", "location", "county", "country",
];

export default function SiteDetail({ kind, id, admin }: { kind: KindKey; id: string; admin: boolean }) {
  const { singular, title } = KINDS[kind];
  const listHref = viewHref("/", kind);
  const router = useRouter();
  const { site, error, loading } = useSite(kind, id);

  if (loading) return <p className="muted text-sm">Loading…</p>;
  if (error || !site)
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Link href={listHref} className="btn">← Back to list</Link>
      </div>
    );

  async function remove() {
    if (!confirm(`Delete ${singular} ${siteCode(kind, site!)}? This cannot be undone.`)) return;
    const res = await fetch(`/api/${kind}/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 404) {
      alert((await res.json().catch(() => null))?.error ?? "Delete failed");
      return;
    }
    router.push(listHref);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Link href={listHref} className="muted text-sm hover:text-foreground">← {title}</Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            <span className="font-mono">{siteCode(kind, site)}</span>
            {site.name && <span className="muted font-normal"> · {site.name}</span>}
          </h1>
          <p className="muted text-sm">
            {site.location}, {site.county}
          </p>
        </div>
        {admin && (
          <div className="ml-auto flex gap-2">
            <Link href={`/${kind}/${id}/edit`} className="btn">Edit</Link>
            <button type="button" onClick={remove} className="btn btn-danger">Delete</button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <dl className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 dark:divide-neutral-900 dark:border-neutral-800">
          {extraFields(kind).map((f) => (
            <div key={f.key} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
              <dt className="muted">{f.label}</dt>
              <dd>{site[f.key]}</dd>
            </div>
          ))}
          {ROWS.map((key) => {
            const { label, unit } = FIELDS[key];
            const value = site[key];
            return (
              <div key={key} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                <dt className="muted">{label}</dt>
                <dd className={typeof value === "number" ? "tabular-nums" : ""}>
                  {typeof value === "number" ? formatNumber(value, key === "latitude" || key === "longitude" ? 6 : 2) : value}
                  {unit && typeof value === "number" && <span className="muted">{unit === "°" ? unit : ` ${unit}`}</span>}
                </dd>
              </div>
            );
          })}
          <div className="flex justify-between gap-4 px-4 py-2.5 text-xs">
            <dt className="muted">Last updated</dt>
            <dd className="muted">{new Date(site.updatedAt).toLocaleString("en-KE")}</dd>
          </div>
        </dl>
        <SiteMap kind={kind} sites={[site]} height="100%" zoom={12} />
      </div>
    </div>
  );
}
