import { Suspense } from "react";
import BoreholeTable from "@/components/BoreholeTable";
import { isAdmin } from "@/lib/auth";

export default async function Home() {
  const admin = await isAdmin();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Boreholes</h1>
      <Suspense>
        <BoreholeTable admin={admin} />
      </Suspense>
    </div>
  );
}
