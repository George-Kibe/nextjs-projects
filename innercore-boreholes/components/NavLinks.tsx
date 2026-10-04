"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { DEFAULT_KIND, KIND_KEYS, parseKind, viewHref } from "@/lib/kinds";

/** List / Map links that keep the selected kind when moving between the two views. */
export default function NavLinks() {
  const pathname = usePathname();
  const params = useSearchParams();
  // On a record page (/minerals/…) the kind comes from the path; on list/map from ?kind=.
  const fromPath = KIND_KEYS.find((k) => pathname.startsWith(`/${k}/`));
  const kind = fromPath ?? parseKind(params.get("kind")) ?? DEFAULT_KIND;

  return (
    <>
      {(["/", "/map"] as const).map((path) => (
        <Link
          key={path}
          href={viewHref(path, kind)}
          className={pathname === path ? "text-foreground" : "muted hover:text-foreground"}
        >
          {path === "/" ? "List" : "Map"}
        </Link>
      ))}
    </>
  );
}
