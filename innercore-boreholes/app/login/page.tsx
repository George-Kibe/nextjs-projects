import Image from "next/image";
import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm pt-12">
      <Image src="/logo.png" alt="Innercore Geoconsultants" width={72} height={64} className="mb-6 rounded-md" />
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Log in</h1>
      <p className="muted mb-6 text-sm">You need the admin password to add, edit or delete boreholes.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
