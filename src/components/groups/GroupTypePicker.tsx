import { GroupTypeIcon } from '@/components/icons'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { GroupType } from '@/domain/types'

const TYPES: { value: GroupType; label: string }[] = [
  { value: 'trip', label: 'Trip' },
  { value: 'home', label: 'Home' },
  { value: 'couple', label: 'Couple' },
  { value: 'other', label: 'Other' },
]

/** The four Group Types; the type only decides the Group's icon. */
export function GroupTypePicker({ value, onChange }: { value: GroupType; onChange: (type: GroupType) => void }) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as GroupType)}
      aria-label="Group type"
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
    >
      {TYPES.map((type) => (
        <label
          key={type.value}
          htmlFor={`group-type-${type.value}`}
          className="flex cursor-pointer items-center gap-2 rounded-xl border p-2 text-sm has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 has-focus-visible:ring-2 has-focus-visible:ring-ring"
        >
          <RadioGroupItem id={`group-type-${type.value}`} value={type.value} className="sr-only" />
          <GroupTypeIcon type={type.value} className="size-8 rounded-lg [&_svg]:size-4" />
          {type.label}
        </label>
      ))}
    </RadioGroup>
  )
}
