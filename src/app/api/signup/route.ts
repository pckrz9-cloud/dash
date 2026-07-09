import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  inviteCode: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input. Password must be at least 8 characters." },
      { status: 400 }
    );
  }
  const { name, email, password, inviteCode } = parsed.data;

  const invite = await prisma.invite.findUnique({
    where: { code: inviteCode.trim().toUpperCase() },
  });
  if (!invite || invite.usedAt) {
    return NextResponse.json(
      { error: "Invalid or already-used invite code. Ask your agency for a new one." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "CLIENT",
      integration: { create: {} },
    },
  });

  await prisma.invite.update({
    where: { id: invite.id },
    data: { usedAt: new Date(), usedById: user.id },
  });

  return NextResponse.json({ ok: true });
}
