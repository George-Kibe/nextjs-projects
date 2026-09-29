import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Innercore Boreholes",
  description: "Borehole records: location, depth, formation and yield",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const admin = await isAdmin();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-neutral-200 dark:border-neutral-800">
          <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 text-sm whitespace-nowrap sm:gap-6">
            <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
              <Image src="/logo.png" alt="Innercore Geoconsultants" width={40} height={36} priority className="rounded-sm" />
              <span>
                <span className="hidden sm:inline">Innercore </span>Boreholes
              </span>
            </Link>
            <Link href="/" className="muted hover:text-foreground">
              List
            </Link>
            <Link href="/map" className="muted hover:text-foreground">
              Map
            </Link>
            <div className="ml-auto flex items-center gap-2">
              {admin ? (
                <>
                  <Link href="/boreholes/new" className="btn btn-primary">
                    <span className="sm:hidden">New</span>
                    <span className="hidden sm:inline">New borehole</span>
                  </Link>
                  <LogoutButton />
                </>
              ) : (
                <Link href="/login" className="btn">
                  Log in
                </Link>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
