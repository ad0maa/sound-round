import { render, screen } from '@cedarjs/testing/web'

import { Loading, Failure, Success } from './LeagueSettingsCell'
import { standard } from './LeagueSettingsCell.mock'

// jsdom has no ResizeObserver; the Switch component expects one.
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

describe('LeagueSettingsCell', () => {
  it('renders Loading successfully', () => {
    expect(() => {
      render(<Loading />)
    }).not.toThrow()
  })

  it('renders Failure successfully', async () => {
    expect(() => {
      render(<Failure error={new Error('Oh no')} />)
    }).not.toThrow()
  })

  it('renders the settings form for a manager', async () => {
    mockCurrentUser({
      id: 'user-1',
      email: 'alice@example.com',
      displayName: 'Alice',
      isDemo: false,
      demoExpiresAt: null,
    })

    render(<Success league={standard().league} id="league-1" />)

    expect(await screen.findByLabelText('Name')).toHaveValue(
      'Friday Sound Club'
    )
    expect(screen.getByText('Members')).toBeInTheDocument()
  })
})
