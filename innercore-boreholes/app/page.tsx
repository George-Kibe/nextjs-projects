import Link from "next/link";
import { Suspense } from "react";
import KindSwitch from "@/components/KindSwitch";
import SiteTable from "@/components/SiteTable";
import { isAdmin } from "@/lib/auth";
import { DEFAULT_KIND, KINDS, parseKind } from "@/lib/kinds";

export default async function Home({ searchParams }: PageProps<"/">) {
  const raw = (await searchParams).kind;
  const kind = parseKind(typeof raw === "string" ? raw : null) ?? DEFAULT_KIND;
  const admin = await isAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-xl font-semibold tracking-tight">{KINDS[kind].title}</h1>
        <KindSwitch path="/" active={kind} />
        {admin && (
          <Link href={`/${kind}/new`} className="btn btn-primary ml-auto">
            New {KINDS[kind].singular}
          </Link>
        )}
      </div>
      <Suspense>
        {/* Keyed by kind so search and paging state reset when switching. */}
        <SiteTable key={kind} kind={kind} admin={admin} />
      </Suspense>
    </div>
  );
}
