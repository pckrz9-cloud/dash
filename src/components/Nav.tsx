"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function Nav({
  name,
  isAdmin,
}: {
  name: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/settings", label: "Settings" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="border-b border-hairline bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-bold tracking-tight">
            📈 Client Portal
          </span>
          <nav className="flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  pathname === l.href
                    ? "bg-plane font-semibold text-ink"
                    : "text-ink-2 hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-ink-2 sm:inline">{name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn-ghost !py-1.5"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
