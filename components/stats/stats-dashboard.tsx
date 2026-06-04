"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { HistoryList } from "@/components/stats/history-list";
import { Metric } from "@/components/stats/metric";
import { WeeklyChart } from "@/components/stats/weekly-chart";
import { formatHours, formatMinutes } from "@/lib/format";
import { dailyAggregates, overview, todaySummary } from "@/lib/stats/compute";
import { statsStore } from "@/lib/storage/stats-store";
import type { DailyAggregate, Session } from "@/lib/types";

export function StatsDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [weekly, setWeekly] = useState<DailyAggregate[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    const nextSessions = await statsStore.getSessions();
    setSessions(nextSessions);
    setWeekly(dailyAggregates(nextSessions, 7));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        await refresh();
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await statsStore.deleteSession(id);
        await refresh();
      } catch (err) {
        console.error("Failed to delete session:", err);
      }
    },
    [refresh],
  );

  const today = useMemo(() => todaySummary(sessions), [sessions]);
  const total = useMemo(() => overview(sessions), [sessions]);

  const streakText =
    total.streakDays > 0 ? `${total.streakDays} 天` : "新的开始";

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-xl font-medium tracking-tight text-foreground">
          统计
        </h1>
        <p className="text-sm text-muted-foreground">
          只记下完整跑完的专注，半段不会被计较
        </p>
      </header>

      {!hydrated ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          正在读取记录…
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Today */}
          <section className="grid grid-cols-2 gap-3">
            <Metric
              label="今日番茄"
              value={`${today.pomodoros}`}
              hint="完成的专注段"
            />
            <Metric
              label="今日专注"
              value={formatMinutes(today.focusMinutes)}
              hint="累计时间"
            />
          </section>

          {/* Weekly chart */}
          <WeeklyChart data={weekly} />

          {/* Overview */}
          <section className="grid grid-cols-3 gap-3">
            <Metric label="总番茄" value={`${total.totalPomodoros}`} />
            <Metric
              label="总专注"
              value={formatHours(total.totalFocusMinutes)}
            />
            <Metric label="连续天数" value={streakText} />
          </section>

          {/* History */}
          <HistoryList sessions={sessions} deleteAction={handleDelete} />
        </div>
      )}
    </main>
  );
}
