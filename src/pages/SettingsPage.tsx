import { useState, useSyncExternalStore, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { getTheme, setTheme, subscribeTheme, type Theme } from '@/lib/theme'
import { useAppStore } from '@/store/appStore'

const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

function Card({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-6 text-card-foreground">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function NameForm() {
  const savedName = useAppStore((state) => state.data.currentUser.name)
  const setCurrentUserName = useAppStore((state) => state.setCurrentUserName)
  const [name, setName] = useState(savedName)
  const trimmed = name.trim()

  // Keep the field in step if the saved name changes elsewhere (e.g. a reset).
  const [lastSaved, setLastSaved] = useState(savedName)
  if (savedName !== lastSaved) {
    setLastSaved(savedName)
    setName(savedName)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!trimmed) return
    setCurrentUserName(trimmed)
    setName(trimmed)
    toast.success('Name updated')
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor="current-user-name">Your name</Label>
        <Input id="current-user-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <Button type="submit" disabled={!trimmed || trimmed === savedName}>
        Save
      </Button>
    </form>
  )
}

function ThemeChoice() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme)
  return (
    <RadioGroup
      value={theme}
      onValueChange={(value) => setTheme(value as Theme)}
      aria-label="Theme"
      className="flex flex-wrap gap-6"
    >
      {THEMES.map(({ value, label }) => (
        <div key={value} className="flex items-center gap-2">
          <RadioGroupItem value={value} id={`theme-${value}`} />
          <Label htmlFor={`theme-${value}`}>{label}</Label>
        </div>
      ))}
    </RadioGroup>
  )
}

function ResetData() {
  const resetToSeed = useAppStore((state) => state.resetToSeed)
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Reset to Seed Data</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset all data?</AlertDialogTitle>
          <AlertDialogDescription>
            Every friend, group, expense and settlement goes back to the original sample data. Changes
            you've made will be lost. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              resetToSeed()
              toast.success('Data reset to the sample data')
            }}
          >
            Reset
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
      <Card title="Profile" description="How you appear throughout the app.">
        <NameForm />
      </Card>
      <Card title="Appearance" description="Follow your system setting, or always use light or dark.">
        <ThemeChoice />
      </Card>
      <Card title="Data" description="Start over from the original sample friends, groups and expenses.">
        <ResetData />
      </Card>
    </div>
  )
}
