import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Friend } from '@/domain/types'
import { useAppStore } from '@/store/appStore'

function FriendForm({ friend, onDone }: { friend?: Friend; onDone: () => void }) {
  const addFriend = useAppStore((state) => state.addFriend)
  const updateFriend = useAppStore((state) => state.updateFriend)
  const [name, setName] = useState(friend?.name ?? '')
  const [email, setEmail] = useState(friend?.email ?? '')
  const [phone, setPhone] = useState(friend?.phone ?? '')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (friend) {
      updateFriend(friend.id, { name, email, phone })
      toast.success('Friend updated')
    } else {
      addFriend({ name, email, phone })
      toast.success(`${name.trim()} added to your friends`)
    }
    onDone()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="friend-name">Name</Label>
        <Input id="friend-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="friend-email">
          Email <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input id="friend-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="friend-phone">
          Phone <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input id="friend-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim()}>
          {friend ? 'Save' : 'Add friend'}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Adds a Friend, or edits `friend`'s name, email and phone when one is given. */
export function FriendDialog({
  open,
  onOpenChange,
  friend,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  friend?: Friend
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{friend ? 'Edit friend' : 'Add a friend'}</DialogTitle>
          <DialogDescription>
            {friend ? 'Email and phone are only shown on their page.' : 'You can add them to a group afterwards.'}
          </DialogDescription>
        </DialogHeader>
        {open && <FriendForm friend={friend} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}
