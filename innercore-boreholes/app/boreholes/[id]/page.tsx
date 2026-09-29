import BoreholeDetail from "@/components/BoreholeDetail";
import { isAdmin } from "@/lib/auth";

export default async function BoreholePage({ params }: PageProps<"/boreholes/[id]">) {
  const { id } = await params;
  return <BoreholeDetail id={id} admin={await isAdmin()} />;
}
