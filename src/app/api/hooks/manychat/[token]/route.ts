import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Inbound webhook for ManyChat flows. Each client gets a private,
 * unguessable URL (shown in Settings):
 *
 *   POST /api/hooks/manychat/<token>?event=conversation
 *   POST /api/hooks/manychat/<token>?event=lead
 *
 * In ManyChat's flow builder, add an "External Request" action pointing at
 * the matching URL — every time the flow runs, today's count ticks up
 * automatically. The token is the auth: it maps to exactly one client, so
 * events can never land on someone else's stats.
 */
async function handle(req: Request, token: string) {
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const integration = await prisma.integration.findUnique({
    where: { webhookToken: token },
  });
  if (!integration) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  let event = url.searchParams.get("event");
  if (!event) {
    // also accept {"event": "..."} in the body for flexibility
    const body = await req.json().catch(() => null);
    if (body && typeof body.event === "string") event = body.event;
  }
  if (event !== "conversation" && event !== "lead") {
    return NextResponse.json(
      { error: "Set ?event=conversation or ?event=lead on the webhook URL" },
      { status: 400 }
    );
  }

  const day = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
  const field = event === "conversation" ? "conversations" : "leads";

  // Read-then-write instead of a blind increment: the column is nullable
  // (manual entries may have set only one field) and null + 1 stays null.
  const existing = await prisma.manychatStat.findUnique({
    where: { userId_date: { userId: integration.userId, date: day } },
  });
  const next = ((existing?.[field] as number | null) ?? 0) + 1;
  await prisma.manychatStat.upsert({
    where: { userId_date: { userId: integration.userId, date: day } },
    update: { [field]: next },
    create: { userId: integration.userId, date: day, [field]: 1 },
  });

  return NextResponse.json({ ok: true, [field]: next });
}

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  return handle(req, params.token);
}

// GET supported so the URL can be tested from a browser.
export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  return handle(req, params.token);
}
