"use client";

import Link from "next/link";
import { KIND_KEYS, KINDS, viewHref, type KindKey } from "@/lib/kinds";

/** Segmented "Boreholes | Minerals" switch. Switching clears filters, sorting and paging. */
export default function KindSwitch({ path, active }: { path: "/" | "/map"; active: KindKey }) {
  return (
    <div role="tablist" aria-label="Record type" className="inline-flex rounded-md border border-neutral-300 p-0.5 text-sm dark:border-neutral-700">
      {KIND_KEYS.map((k) => (
        <Link
          key={k}
          role="tab"
          aria-selected={k === active}
          href={viewHref(path, k)}
          scroll={false}
          className={`flex items-center gap-1.5 rounded px-3 py-1 font-medium transition-colors ${
            k === active
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              : "muted hover:text-foreground"
          }`}
        >
          <span className="size-2 rounded-full" style={{ backgroundColor: KINDS[k].color }} aria-hidden />
          {KINDS[k].title}
        </Link>
      ))}
    </div>
  );
}
