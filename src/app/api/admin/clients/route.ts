import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Admin-only overview of client accounts and their connection health.
// Deliberately returns NO stats and NO credentials — just account status.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      integration: {
        select: {
          lastSyncAt: true,
          igTokenEnc: true,
          calendlyTokenEnc: true,
          instagramError: true,
          calendlyError: true,
        },
      },
    },
  });
  return NextResponse.json({
    clients: clients.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      createdAt: c.createdAt,
      lastSyncAt: c.integration?.lastSyncAt ?? null,
      connected: {
        instagram: Boolean(c.integration?.igTokenEnc),
        calendly: Boolean(c.integration?.calendlyTokenEnc),
      },
      hasErrors: Boolean(
        c.integration?.instagramError || c.integration?.calendlyError
      ),
    })),
  });
}
