import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { Avatar } from '@/components/Avatar'
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isGroupSettledUp } from '@/domain/balances'
import { openDebtsHint, removalBlockers, type NewMember } from '@/domain/membership'
import { personName, shortName } from '@/domain/people'
import type { AppData, Group, GroupType } from '@/domain/types'
import { CURRENT_USER_ID } from '@/domain/types'
import { useAppStore } from '@/store/appStore'

import { GroupTypePicker } from './GroupTypePicker'
import { MemberPicker } from './MemberPicker'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t pt-5 first:border-t-0 first:pt-0">
      <h3 className="font-heading font-semibold">{title}</h3>
      {children}
    </section>
  )
}

function DetailsForm({ group }: { group: Group }) {
  const updateGroupDetails = useAppStore((state) => state.updateGroupDetails)
  const [name, setName] = useState(group.name)
  const [type, setType] = useState<GroupType>(group.type)
  const unchanged = name.trim() === group.name && type === group.type

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || unchanged) return
    updateGroupDetails(group.id, { name, type })
    toast.success('Group updated')
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="settings-group-name">Name</Label>
        <Input id="settings-group-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <GroupTypePicker value={type} onChange={setType} />
      <div>
        <Button type="submit" disabled={!name.trim() || unchanged}>
          Save changes
        </Button>
      </div>
    </form>
  )
}

function AddMembers({ data, group }: { data: AppData; group: Group }) {
  const addGroupMembers = useAppStore((state) => state.addGroupMembers)
  const [members, setMembers] = useState<NewMember[]>([])

  function add() {
    addGroupMembers(group.id, members)
    toast.success(members.length === 1 ? 'Member added' : `${members.length} members added`)
    setMembers([])
  }

  return (
    <div className="flex flex-col gap-3">
      <MemberPicker data={data} value={members} onChange={setMembers} excludeIds={[...group.memberIds, ...group.formerMemberIds]} />
      {members.length > 0 && (
        <div>
          <Button type="button" onClick={add}>
            Add to group
          </Button>
        </div>
      )}
    </div>
  )
}

function MemberList({ data, group }: { data: AppData; group: Group }) {
  const removeGroupMember = useAppStore((state) => state.removeGroupMember)
  return (
    <ul className="flex flex-col gap-1">
      {group.memberIds.map((personId) => {
        const name = personName(data, personId)
        const you = personId === CURRENT_USER_ID
        // Only someone with no open Debt in the Group can leave it; a net ₹0 isn't enough.
        const blockers = you ? [] : removalBlockers(data, group.id, personId)
        const hintId = `remove-hint-${personId}`
        return (
          <li key={personId} className="flex flex-col gap-1 rounded-lg px-1 py-1.5">
            <div className="flex items-center gap-3">
              <Avatar name={name} className="size-8 text-xs" />
              <span className="flex-1 truncate">{you ? `${name} (you)` : name}</span>
              {!you && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={blockers.length > 0}
                  aria-describedby={blockers.length > 0 ? hintId : undefined}
                  aria-label={`Remove ${name}`}
                  onClick={() => {
                    removeGroupMember(group.id, personId)
                    toast.success(`${shortName(data, personId)} removed from ${group.name}`)
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
            {blockers.length > 0 && (
              <p id={hintId} className="ml-11 text-xs text-muted-foreground">
                {openDebtsHint(data, personId, blockers)}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function FormerMemberList({ data, group }: { data: AppData; group: Group }) {
  const addGroupMembers = useAppStore((state) => state.addGroupMembers)
  return (
    <ul className="flex flex-col gap-1">
      {group.formerMemberIds.map((personId) => {
        const name = personName(data, personId)
        return (
          <li key={personId} className="flex items-center gap-3 rounded-lg px-1 py-1.5">
            <Avatar name={name} className="size-8 text-xs opacity-60" />
            <span className="flex-1 truncate text-muted-foreground">{name}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`Re-add ${name}`}
              onClick={() => {
                addGroupMembers(group.id, [{ kind: 'friend', friendId: personId }])
                toast.success(`${shortName(data, personId)} is back in ${group.name}`)
              }}
            >
              Re-add
            </Button>
          </li>
        )
      })}
    </ul>
  )
}

/** Deleting is only possible once every Debt in the Group is ₹0; net balances of ₹0 aren't enough. */
function DeleteGroup({ data, group }: { data: AppData; group: Group }) {
  const deleteGroup = useAppStore((state) => state.deleteGroup)
  const navigate = useNavigate()
  const settled = isGroupSettledUp(data, group.id)

  return (
    <div className="flex flex-col gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="destructive"
            className="self-start"
            disabled={!settled}
            aria-describedby={settled ? undefined : 'delete-group-hint'}
          >
            Delete group
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{group.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The group and all its expenses and payments will be removed. Its members stay your friends. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                // Leave the page first, so it never renders a Group that's gone.
                navigate('/')
                deleteGroup(group.id)
                toast.success(`Group “${group.name}” deleted`)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {!settled && (
        <p id="delete-group-hint" className="text-sm text-muted-foreground">
          Settle all balances in {group.name} before deleting it.
        </p>
      )}
    </div>
  )
}

/** Rename a Group, change its type, manage its members, or delete it. */
export function GroupSettingsDialog({
  open,
  onOpenChange,
  group,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group
}) {
  const data = useAppStore((state) => state.data)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Group settings</DialogTitle>
          <DialogDescription>Changes to {group.name} apply straight away.</DialogDescription>
        </DialogHeader>
        {open && (
          <div className="flex flex-col gap-5">
            <Section title="Details">
              <DetailsForm group={group} />
            </Section>
            <Section title={`Members (${group.memberIds.length})`}>
              <MemberList data={data} group={group} />
            </Section>
            {group.formerMemberIds.length > 0 && (
              <Section title="Former members">
                <p className="-mt-1 text-sm text-muted-foreground">
                  They still appear on past expenses, which stay read-only until they're re-added.
                </p>
                <FormerMemberList data={data} group={group} />
              </Section>
            )}
            <Section title="Add members">
              <AddMembers data={data} group={group} />
            </Section>
            <Section title="Delete group">
              <DeleteGroup data={data} group={group} />
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
