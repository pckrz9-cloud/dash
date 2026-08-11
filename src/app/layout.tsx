import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Client Dashboard",
  description:
    "Your AI appointment-setter performance: ManyChat, Instagram and upcoming Calendly calls in one place.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
