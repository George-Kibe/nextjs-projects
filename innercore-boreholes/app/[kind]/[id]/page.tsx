import { notFound } from "next/navigation";
import SiteDetail from "@/components/SiteDetail";
import { isAdmin } from "@/lib/auth";
import { parseKind } from "@/lib/kinds";

export default async function SitePage({ params }: PageProps<"/[kind]/[id]">) {
  const { kind: rawKind, id } = await params;
  const kind = parseKind(rawKind);
  if (!kind) notFound();
  return <SiteDetail kind={kind} id={id} admin={await isAdmin()} />;
}
