import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, maskSecret } from "@/lib/crypto";
import { syncUser } from "@/lib/sync";

export const dynamic = "force-dynamic";

// GET: the logged-in user's integration status (secrets masked, never returned).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let integration = await prisma.integration.findUnique({
    where: { userId: session.user.id },
  });

  // Every client gets a private BooSend webhook URL — mint the token lazily.
  if (!integration?.webhookToken) {
    const webhookToken = crypto.randomBytes(24).toString("base64url");
    integration = await prisma.integration.upsert({
      where: { userId: session.user.id },
      update: { webhookToken },
      create: { userId: session.user.id, webhookToken },
    });
  }

  return NextResponse.json({
    webhookToken: integration.webhookToken,
    igToken: maskSecret(integration?.igTokenEnc),
    igUserId: integration?.igUserId ?? null,
    calendlyToken: maskSecret(integration?.calendlyTokenEnc),
    lastSyncAt: integration?.lastSyncAt ?? null,
    errors: {
      instagram: integration?.instagramError ?? null,
      calendly: integration?.calendlyError ?? null,
    },
  });
}

const schema = z.object({
  igToken: z.string().max(1000).optional(),
  igUserId: z.string().max(100).optional(),
  calendlyToken: z.string().max(1000).optional(),
  clear: z.array(z.enum(["instagram", "calendly"])).optional(),
});

// PUT: save credentials for the logged-in user only. Empty fields are left
// unchanged; use `clear` to disconnect an integration.
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { igToken, igUserId, calendlyToken, clear } = parsed.data;

  const data: Record<string, string | null> = {};
  if (igToken?.trim()) data.igTokenEnc = encrypt(igToken.trim());
  if (igUserId?.trim()) data.igUserId = igUserId.trim();
  if (calendlyToken?.trim()) data.calendlyTokenEnc = encrypt(calendlyToken.trim());

  for (const c of clear ?? []) {
    if (c === "instagram") {
      data.igTokenEnc = null;
      data.igUserId = null;
      data.instagramError = null;
    }
    if (c === "calendly") {
      data.calendlyTokenEnc = null;
      data.calendlyError = null;
    }
  }

  await prisma.integration.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });

  // Immediately try the new credentials so the user gets instant feedback.
  await syncUser(session.user.id, true);

  const integration = await prisma.integration.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({
    ok: true,
    errors: {
      instagram: integration?.instagramError ?? null,
      calendly: integration?.calendlyError ?? null,
    },
  });
}
