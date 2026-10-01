import type { RouteObject } from 'react-router'

import { AppLayout } from '@/components/layout/AppLayout'
import { AllExpensesPage } from '@/pages/AllExpensesPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { FriendPage } from '@/pages/FriendPage'
import { GroupPage } from '@/pages/GroupPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SettingsPage } from '@/pages/SettingsPage'

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/expenses', element: <AllExpensesPage /> },
      { path: '/groups/:groupId', element: <GroupPage /> },
      { path: '/friends/:friendId', element: <FriendPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
