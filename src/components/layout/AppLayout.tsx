import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router'

import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'

import { SidebarNav } from './SidebarNav'

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-svh bg-background">
      {/* Wide screens: fixed sidebar flush to the left edge. */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border bg-sidebar md:block">
        <SidebarNav />
      </aside>

      {/* Narrow screens: top bar with a menu button that slides the sidebar out. */}
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b bg-background/95 px-3 py-2 backdrop-blur md:hidden">
        <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <Menu aria-hidden="true" />
        </Button>
        <Logo />
      </header>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          className="w-72 bg-sidebar p-0"
          // Close the slide-out menu once a link in it is followed.
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a')) setMenuOpen(false)
          }}
        >
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Main navigation</SheetDescription>
          <SidebarNav />
        </SheetContent>
      </Sheet>

      <main className="md:pl-64">
        <div className="px-4 py-6 md:px-10 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
