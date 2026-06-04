import { NextResponse } from "next/server";

import { addSession, getSessions } from "@/lib/storage/server/file-store";
import type { Session } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessions = await getSessions();
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const session = (await request.json()) as Session;
  await addSession(session);
  return NextResponse.json({ ok: true });
}
