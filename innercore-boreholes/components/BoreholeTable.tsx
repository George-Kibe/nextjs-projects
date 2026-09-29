"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { KENYAN_COUNTIES } from "@/lib/counties";
import { FIELDS, formatNumber } from "@/lib/fields";
import type { Borehole } from "@/lib/validation";

type ListResponse = { items: Borehole[]; total: number; page: number; pages: number };
type Column = { key: keyof Borehole; numeric?: boolean };

const COLUMNS: Column[] = [
  { key: "boreholeId" },
  { key: "location" },
  { key: "county" },
  { key: "formation" },
  { key: "depth", numeric: true },
  { key: "yield", numeric: true },
  { key: "elevation", numeric: true },
];

export default function BoreholeTable({ admin }: { admin: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();

  const sort = params.get("sort") ?? "createdAt";
  const order = params.get("order") ?? "desc";
  const county = params.get("county") ?? "";

  const [search, setSearch] = useState(params.get("q") ?? "");
  const [result, setResult] = useState<{ key: string; data?: ListResponse; error?: string } | null>(null);
  const [reload, setReload] = useState(0);
  const requestKey = `${query}#${reload}`;
  const loading = result?.key !== requestKey;

  function setParams(changes: Record<string, string | null>, resetPage = true) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (resetPage) next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // Debounce typing into the search box before updating the URL.
  useEffect(() => {
    if (search === (params.get("q") ?? "")) return;
    const t = setTimeout(() => setParams({ q: search.trim() || null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/boreholes?${query}`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Failed to load boreholes");
        setResult({ key: requestKey, data: body });
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setResult({ key: requestKey, error: err.message });
      });
    return () => controller.abort();
  }, [query, requestKey]);

  function toggleSort(key: string) {
    const nextOrder = sort === key && order === "asc" ? "desc" : "asc";
    setParams({ sort: key, order: nextOrder });
  }

  async function remove(b: Borehole) {
    if (!confirm(`Delete borehole ${b.boreholeId}? This cannot be undone.`)) return;
    const res = await fetch(`/api/boreholes/${b._id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 404) {
      alert((await res.json().catch(() => null))?.error ?? "Delete failed");
      return;
    }
    setReload((n) => n + 1);
  }

  const data = result?.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ID, location, formation…"
          className="input sm:max-w-xs"
          aria-label="Search boreholes"
        />
        <select
          value={county}
          onChange={(e) => setParams({ county: e.target.value || null })}
          className="input sm:max-w-48"
          aria-label="Filter by county"
        >
          <option value="">All counties</option>
          {KENYAN_COUNTIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <p className="muted text-sm sm:ml-auto sm:self-center">
          {data ? `${data.total} borehole${data.total === 1 ? "" : "s"}` : " "}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 text-left dark:border-neutral-800">
            <tr>
              {COLUMNS.map(({ key, numeric }) => {
                const active = sort === key;
                const { label, unit } = FIELDS[key as keyof typeof FIELDS];
                return (
                  <th key={key} className={`px-3 py-2 font-medium whitespace-nowrap ${numeric ? "text-right" : ""}`}>
                    <button
                      type="button"
                      onClick={() => toggleSort(key)}
                      className={`inline-flex items-center gap-1 hover:text-foreground ${active ? "" : "muted"}`}
                    >
                      {label}
                      {unit && <span className="font-normal text-neutral-400">({unit})</span>}
                      <span className="w-3 text-xs">{active ? (order === "asc" ? "↑" : "↓") : ""}</span>
                    </button>
                  </th>
                );
              })}
              <th className="px-3 py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className={loading ? "opacity-50 transition-opacity" : ""}>
            {result?.error && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-3 py-10 text-center text-red-600 dark:text-red-400">
                  {result.error}
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="muted px-3 py-10 text-center">
                  {query ? "No boreholes match your filters." : "No boreholes yet."}
                </td>
              </tr>
            )}
            {!data && !result?.error && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="muted px-3 py-10 text-center">
                  Loading…
                </td>
              </tr>
            )}
            {data?.items.map((b) => (
              <tr
                key={b._id}
                className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/50"
              >
                {COLUMNS.map(({ key, numeric }) => (
                  <td key={key} className={`px-3 py-2 whitespace-nowrap ${numeric ? "text-right tabular-nums" : ""}`}>
                    {key === "boreholeId" ? (
                      <Link href={`/boreholes/${b._id}`} className="font-mono font-medium hover:underline">
                        {b.boreholeId}
                      </Link>
                    ) : numeric ? (
                      formatNumber(b[key] as number)
                    ) : (
                      String(b[key])
                    )}
                  </td>
                ))}
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  {admin && (
                    <span className="inline-flex gap-1">
                      <Link href={`/boreholes/${b._id}/edit`} className="btn border-transparent px-2 py-1">
                        Edit
                      </Link>
                      <button type="button" onClick={() => remove(b)} className="btn btn-danger border-transparent px-2 py-1">
                        Delete
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            className="btn"
            disabled={data.page <= 1}
            onClick={() => setParams({ page: String(data.page - 1) }, false)}
          >
            ← Previous
          </button>
          <span className="muted">
            Page {data.page} of {data.pages}
          </span>
          <button
            type="button"
            className="btn"
            disabled={data.page >= data.pages}
            onClick={() => setParams({ page: String(data.page + 1) }, false)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
