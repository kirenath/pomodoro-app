// Client-side storage adapter. The real persistence is handled by API routes
// that write JSON files on the server.

import type { Session, Settings } from "@/lib/types";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
}

export interface StatsStore {
  getSettings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<void>;
  getSessions(range?: { from: Date; to: Date }): Promise<Session[]>;
  addSession(s: Session): Promise<void>;
  deleteSession(id: string): Promise<void>;
}

export class ApiStatsStore implements StatsStore {
  async getSettings(): Promise<Settings> {
    return requestJson<Settings>("/api/settings");
  }

  async saveSettings(s: Settings): Promise<void> {
    await requestJson<{ ok: boolean }>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(s),
    });
  }

  async getSessions(range?: { from: Date; to: Date }): Promise<Session[]> {
    const sessions = await requestJson<Session[]>("/api/sessions");
    if (!range) return sortNewestFirst(sessions);

    const fromMs = range.from.getTime();
    const toMs = range.to.getTime();
    return sortNewestFirst(
      sessions.filter((s) => {
        const t = new Date(s.startedAt).getTime();
        return t >= fromMs && t <= toMs;
      }),
    );
  }

  async addSession(s: Session): Promise<void> {
    await requestJson<{ ok: boolean }>("/api/sessions", {
      method: "POST",
      body: JSON.stringify(s),
    });
  }

  async deleteSession(id: string): Promise<void> {
    await requestJson<{ ok: boolean }>(
      `/api/sessions/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );
  }
}

function sortNewestFirst(sessions: Session[]): Session[] {
  return [...sessions].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
}

export const statsStore: StatsStore = new ApiStatsStore();
