import { render, screen } from '@cedarjs/testing/web'

import { Loading, Failure, Success } from './LeagueStatsCell'
import { standard } from './LeagueStatsCell.mock'

describe('LeagueStatsCell', () => {
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

  it('renders superlatives', async () => {
    render(<Success leagueStats={standard().leagueStats} leagueId="league-1" />)
    expect(await screen.findByText('Best single round')).toBeInTheDocument()
    expect(screen.getByText('“Barbie Girl”')).toBeInTheDocument()
    expect(screen.getByText('Carol → Alice')).toBeInTheDocument()
  })
})
