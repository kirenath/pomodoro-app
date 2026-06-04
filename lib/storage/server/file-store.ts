// Server-only persistence backed by two JSON files under <project>/data/.
// Strategy: load once into an in-memory cache on first access, then keep
// reads fast and writes durable. Writes are atomic (tmp + rename) so a
// crash mid-write can't leave the real file half-written.
//
// This module touches `node:fs` and must NEVER be imported from a client
// component. The "server-only" import enforces that at build time.

import "server-only";
import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { DEFAULT_SETTINGS, type Session, type Settings } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

let sessionsCache: Session[] | null = null;
let settingsCache: Settings | null = null;
let initPromise: Promise<void> | null = null;
let sessionsWriteQueue = Promise.resolve();
let settingsWriteQueue = Promise.resolve();

async function readJsonOr<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    // A corrupt JSON file shouldn't crash the whole server; log and recover.
    console.error(`[file-store] Failed to read ${file}, using fallback:`, err);
    return fallback;
  }
}

// Atomic write: write to a sibling tmp file, then rename over the target.
// rename(2) is atomic on the same filesystem, so a reader/restart will
// always see either the old file or the fully-written new file.
async function writeJsonAtomic(file: string, data: unknown): Promise<void> {
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await rename(tmp, file);
}

async function createFileIfMissing(file: string, data: unknown): Promise<void> {
  try {
    await access(file);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    await writeJsonAtomic(file, data);
  }
}

async function enqueueSessionsWrite(write: () => Promise<void>): Promise<void> {
  const next = sessionsWriteQueue.catch(() => undefined).then(write);
  sessionsWriteQueue = next.catch(() => undefined);
  await next;
}

async function enqueueSettingsWrite(write: () => Promise<void>): Promise<void> {
  const next = settingsWriteQueue.catch(() => undefined).then(write);
  settingsWriteQueue = next.catch(() => undefined);
  await next;
}

async function init(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const [sessions, settings] = await Promise.all([
    readJsonOr<Session[]>(SESSIONS_FILE, []),
    readJsonOr<Partial<Settings>>(SETTINGS_FILE, {}),
  ]);
  sessionsCache = Array.isArray(sessions) ? sessions : [];
  settingsCache = { ...DEFAULT_SETTINGS, ...settings };
  await Promise.all([
    createFileIfMissing(SESSIONS_FILE, sessionsCache),
    createFileIfMissing(SETTINGS_FILE, settingsCache),
  ]);
}

async function ensureReady(): Promise<void> {
  if (sessionsCache && settingsCache) return;
  if (!initPromise) initPromise = init();
  await initPromise;
}

export async function getSessions(): Promise<Session[]> {
  await ensureReady();
  // Return a shallow copy so callers can't mutate the cache.
  return [...sessionsCache!];
}

export async function addSession(s: Session): Promise<void> {
  await ensureReady();
  await enqueueSessionsWrite(async () => {
    if (sessionsCache!.some((x) => x.id === s.id)) return;
    const next = [...sessionsCache!, s];
    await writeJsonAtomic(SESSIONS_FILE, next);
    sessionsCache = next;
  });
}

export async function deleteSession(id: string): Promise<void> {
  await ensureReady();
  await enqueueSessionsWrite(async () => {
    const next = sessionsCache!.filter((s) => s.id !== id);
    if (next.length === sessionsCache!.length) return;
    await writeJsonAtomic(SESSIONS_FILE, next);
    sessionsCache = next;
  });
}

export async function getSettings(): Promise<Settings> {
  await ensureReady();
  return { ...settingsCache! };
}

export async function saveSettings(s: Settings): Promise<void> {
  await ensureReady();
  await enqueueSettingsWrite(async () => {
    const merged = { ...DEFAULT_SETTINGS, ...s };
    await writeJsonAtomic(SETTINGS_FILE, merged);
    settingsCache = merged;
  });
}
