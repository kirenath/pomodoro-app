import { SettingsForm } from '@/components/settings/settings-form'

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-xl font-medium tracking-tight text-foreground">
          设置
        </h1>
        <p className="text-sm text-muted-foreground">改动会自动保存</p>
      </header>
      <SettingsForm />
    </main>
  )
}
