import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  userId: z.string().min(1),
  conversations: z.number().int().min(0).max(10_000_000).nullable().optional(),
  leads: z.number().int().min(0).max(10_000_000).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// Admin-only: adjust a client's ManyChat conversation/lead numbers on their
// behalf — a manual override for the automatic webhook counters.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { userId, conversations, leads, date } = parsed.data;

  const client = await prisma.user.findUnique({ where: { id: userId } });
  if (!client || client.role !== "CLIENT") {
    return NextResponse.json({ error: "Unknown client" }, { status: 404 });
  }

  const day = new Date(`${date ?? new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
  const data: Record<string, number | null> = {};
  if (conversations !== undefined) data.conversations = conversations;
  if (leads !== undefined) data.leads = leads;

  const row = await prisma.manychatStat.upsert({
    where: { userId_date: { userId, date: day } },
    update: data,
    create: { userId, date: day, ...data },
  });
  return NextResponse.json({ ok: true, stat: row });
}
