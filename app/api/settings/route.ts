import { NextResponse } from "next/server";

import { getSettings, saveSettings } from "@/lib/storage/server/file-store";
import type { Settings } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const settings = (await request.json()) as Settings;
  await saveSettings(settings);
  return NextResponse.json({ ok: true });
}
