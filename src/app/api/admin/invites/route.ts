import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const invites = await prisma.invite.findMany({
    orderBy: { createdAt: "desc" },
    include: { usedBy: { select: { email: true, name: true } } },
    take: 50,
  });
  return NextResponse.json({ invites });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const label =
    typeof body?.label === "string" ? body.label.trim().slice(0, 100) : null;

  // 10-char unambiguous code, e.g. "K7P2-M9XQ4R"
  const code = crypto
    .randomBytes(8)
    .toString("base64url")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 10)
    .toUpperCase();

  const invite = await prisma.invite.create({ data: { code, label } });
  return NextResponse.json({ invite });
}
