import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'

import { routes } from './routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
}

describe('app skeleton', () => {
  it('renders the Dashboard inside the layout', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getAllByRole('navigation', { name: 'Main' }).length).toBeGreaterThan(0)
  })
})
