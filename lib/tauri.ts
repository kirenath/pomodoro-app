"use client";

const MINI_SIZE = { width: 230, height: 110 };
const FULL_SIZE = { width: 420, height: 660 };

export function isTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window ||
      window.location.hostname === "pomodoro.kirwitheli.date")
  );
}

export async function enterMiniMode(): Promise<void> {
  const { getCurrentWindow, LogicalSize } = await import(
    "@tauri-apps/api/window"
  );
  const win = getCurrentWindow();
  await win.setDecorations(false);
  await win.setSize(new LogicalSize(MINI_SIZE.width, MINI_SIZE.height));
}

export async function exitMiniMode(): Promise<void> {
  const { getCurrentWindow, LogicalSize } = await import(
    "@tauri-apps/api/window"
  );
  const win = getCurrentWindow();
  await win.setDecorations(true);
  await win.setSize(new LogicalSize(FULL_SIZE.width, FULL_SIZE.height));
}
