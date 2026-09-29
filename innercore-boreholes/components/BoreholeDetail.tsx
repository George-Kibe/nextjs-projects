"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FIELDS, formatNumber } from "@/lib/fields";
import type { BoreholeInput } from "@/lib/validation";
import BoreholeMap from "./BoreholeMap";
import { useBorehole } from "./useBorehole";

const ROWS: (keyof BoreholeInput)[] = [
  "latitude", "longitude", "elevation", "depth", "yield", "formation", "location", "county", "country",
];

export default function BoreholeDetail({ id, admin }: { id: string; admin: boolean }) {
  const router = useRouter();
  const { borehole, error, loading } = useBorehole(id);

  if (loading) return <p className="muted text-sm">Loading…</p>;
  if (error || !borehole)
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Link href="/" className="btn">← Back to list</Link>
      </div>
    );

  async function remove() {
    if (!confirm(`Delete borehole ${borehole!.boreholeId}? This cannot be undone.`)) return;
    const res = await fetch(`/api/boreholes/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 404) {
      alert((await res.json().catch(() => null))?.error ?? "Delete failed");
      return;
    }
    router.push("/");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Link href="/" className="muted text-sm hover:text-foreground">← Boreholes</Link>
          <h1 className="mt-1 font-mono text-2xl font-semibold tracking-tight">{borehole.boreholeId}</h1>
          <p className="muted text-sm">
            {borehole.location}, {borehole.county}
          </p>
        </div>
        {admin && (
          <div className="ml-auto flex gap-2">
            <Link href={`/boreholes/${id}/edit`} className="btn">Edit</Link>
            <button type="button" onClick={remove} className="btn btn-danger">Delete</button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <dl className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 dark:divide-neutral-900 dark:border-neutral-800">
          {ROWS.map((key) => {
            const { label, unit } = FIELDS[key];
            const value = borehole[key];
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
            <dd className="muted">{new Date(borehole.updatedAt).toLocaleString("en-KE")}</dd>
          </div>
        </dl>
        <BoreholeMap boreholes={[borehole]} height="100%" zoom={12} />
      </div>
    </div>
  );
}
