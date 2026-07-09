import { NextResponse } from "next/server";
import { syncAllUsers } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Background refresh for ALL clients. Point a scheduler (Vercel Cron, GitHub
 * Actions, any curl in a crontab) at this every 15-30 minutes:
 *   GET /api/cron/sync  with header  Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await syncAllUsers();
  return NextResponse.json(result);
}
