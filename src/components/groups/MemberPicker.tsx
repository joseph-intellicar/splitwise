import { UserPlus, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { NewMember } from '@/domain/membership'
import type { AppData, PersonId } from '@/domain/types'

function memberName(data: AppData, member: NewMember) {
  return member.kind === 'new' ? member.name : (data.friends.find((f) => f.id === member.friendId)?.name ?? 'Unknown')
}

/**
 * Builds an ordered list of people to add: existing Friends picked from a
 * list, or new people typed in (who become Friends on save). `excludeIds`
 * are people already in the Group.
 */
export function MemberPicker({
  data,
  value,
  onChange,
  excludeIds = [],
}: {
  data: AppData
  value: NewMember[]
  onChange: (members: NewMember[]) => void
  excludeIds?: PersonId[]
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [addingNew, setAddingNew] = useState(false)
  const chosenIds = value.flatMap((m) => (m.kind === 'friend' ? [m.friendId] : []))
  const available = data.friends
    .filter((f) => !excludeIds.includes(f.id) && !chosenIds.includes(f.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  function addNew() {
    if (!name.trim()) return
    onChange([...value, { kind: 'new', name: name.trim(), email: email.trim(), phone: phone.trim() }])
    setName('')
    setEmail('')
    setPhone('')
    setAddingNew(false)
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="People to add">
          {value.map((member, i) => (
            <li key={i} className="flex items-center gap-1 rounded-full border bg-primary/10 py-1 pr-1 pl-3 text-sm">
              {memberName(data, member)}
              {member.kind === 'new' && <span className="text-xs text-muted-foreground">(new)</span>}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${memberName(data, member)}`}
                onClick={() => onChange(value.filter((_, j) => j !== i))}
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          value=""
          onValueChange={(friendId) => onChange([...value, { kind: 'friend', friendId }])}
          disabled={available.length === 0}
        >
          <SelectTrigger aria-label="Add a friend" className="w-full sm:flex-1">
            <SelectValue placeholder={available.length === 0 ? 'No more friends to add' : 'Add a friend'} />
          </SelectTrigger>
          <SelectContent>
            {available.map((friend) => (
              <SelectItem key={friend.id} value={friend.id}>
                {friend.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!addingNew && (
          <Button type="button" variant="outline" onClick={() => setAddingNew(true)}>
            <UserPlus aria-hidden="true" />
            New person
          </Button>
        )}
      </div>

      {addingNew && (
        <fieldset className="flex flex-col gap-3 rounded-xl border p-4">
          <legend className="px-1 text-sm font-medium">New person</legend>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-person-name">Name</Label>
            <Input
              id="new-person-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addNew()
                }
              }}
              autoFocus
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-person-email">
                Email <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input id="new-person-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-person-phone">
                Phone <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input id="new-person-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={addNew} disabled={!name.trim()}>
              Add person
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAddingNew(false)}>
              Cancel
            </Button>
          </div>
        </fieldset>
      )}
    </div>
  )
}
