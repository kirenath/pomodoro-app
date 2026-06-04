"use client";

import { useSettings } from "@/components/settings-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import type { Settings, ThemePreference } from "@/lib/types";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "浅色" },
  { value: "dark", label: "深色" },
  { value: "auto", label: "跟随系统" },
];

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: NumberFieldProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isNaN(n)) return;
            onChange(Math.min(max, Math.max(min, Math.round(n))));
          }}
          className="w-20 text-center tabular-nums"
        />
        <span className="w-8 text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

export function SettingsForm() {
  const { settings, hydrated, updateSettings } = useSettings();

  const set = (patch: Partial<Settings>) => updateSettings(patch);

  if (!hydrated) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        正在读取设置…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Durations */}
      <Card>
        <CardHeader>
          <CardTitle>时长</CardTitle>
          <CardDescription>找到适合自己的节奏，随时可以改</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <NumberField
            id="focusMin"
            label="专注时长"
            value={settings.focusMin}
            min={1}
            max={120}
            unit="分钟"
            onChange={(v) => set({ focusMin: v })}
          />
          <NumberField
            id="shortBreakMin"
            label="短休息"
            value={settings.shortBreakMin}
            min={1}
            max={60}
            unit="分钟"
            onChange={(v) => set({ shortBreakMin: v })}
          />
          <NumberField
            id="longBreakMin"
            label="长休息"
            value={settings.longBreakMin}
            min={1}
            max={60}
            unit="分钟"
            onChange={(v) => set({ longBreakMin: v })}
          />
          <NumberField
            id="cyclesPerLongBreak"
            label="几个专注后长休"
            value={settings.cyclesPerLongBreak}
            min={1}
            max={12}
            unit="个"
            onChange={(v) => set({ cyclesPerLongBreak: v })}
          />
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>主题</CardTitle>
          <CardDescription>暖色更安静一些</CardDescription>
        </CardHeader>
        <CardContent>
          <Segmented
            aria-label="选择主题"
            options={THEME_OPTIONS}
            value={settings.theme}
            onChange={(v) => set({ theme: v })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
