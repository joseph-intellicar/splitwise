import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { NewMember } from '@/domain/membership'
import type { GroupType } from '@/domain/types'
import { useAppStore } from '@/store/appStore'

import { GroupTypePicker } from './GroupTypePicker'
import { MemberPicker } from './MemberPicker'

function CreateGroupForm({ initialMembers, onDone }: { initialMembers: NewMember[]; onDone: (groupId?: string) => void }) {
  const data = useAppStore((state) => state.data)
  const createGroup = useAppStore((state) => state.createGroup)
  const [name, setName] = useState('')
  const [type, setType] = useState<GroupType>('trip')
  const [members, setMembers] = useState<NewMember[]>(initialMembers)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const id = createGroup({ name, type, members })
    toast.success(`Group “${name.trim()}” created`)
    onDone(id)
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="group-name">Name</Label>
        <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Goa Trip" required autoFocus />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          Type
        </span>
        <GroupTypePicker value={type} onChange={setType} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Members</span>
        <p className="text-sm text-muted-foreground">You're always in the group. Add friends, or someone new.</p>
        <MemberPicker data={data} value={members} onChange={setMembers} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onDone()}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim()}>
          Create group
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Creates a Group, then goes straight to its page. `initialMembers` pre-fills the member list. */
export function CreateGroupDialog({
  open,
  onOpenChange,
  initialMembers = [],
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMembers?: NewMember[]
  onCreated?: () => void
}) {
  const navigate = useNavigate()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create a group</DialogTitle>
          <DialogDescription>A group keeps a running tab of shared expenses.</DialogDescription>
        </DialogHeader>
        {open && (
          <CreateGroupForm
            initialMembers={initialMembers}
            onDone={(groupId) => {
              onOpenChange(false)
              if (groupId) {
                onCreated?.()
                navigate(`/groups/${groupId}`)
              }
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
