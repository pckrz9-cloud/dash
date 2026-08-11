import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  conversations: z.number().int().min(0).max(10_000_000).nullable().optional(),
  leads: z.number().int().min(0).max(10_000_000).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // defaults to today
});

// Manually adjust the logged-in client's own ManyChat conversation/lead
// numbers for a given day. Day to day these arrive automatically from the
// client's ManyChat flows (see /api/hooks/manychat/[token]); this is the
// correction path.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { conversations, leads, date } = parsed.data;

  const day = new Date(`${date ?? new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);

  const data: Record<string, number | null> = {};
  if (conversations !== undefined) data.conversations = conversations;
  if (leads !== undefined) data.leads = leads;

  const row = await prisma.manychatStat.upsert({
    where: { userId_date: { userId: session.user.id, date: day } },
    update: data,
    create: { userId: session.user.id, date: day, ...data },
  });
  return NextResponse.json({ ok: true, stat: row });
}
