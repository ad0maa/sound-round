import { render } from '@cedarjs/testing/web'

import LeagueStatsPage from './LeagueStatsPage'

//   Improve this test with help from the CedarJS Testing Doc:
//   https://cedarjs.com/docs/testing#testing-pages-layouts

describe('LeagueStatsPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<LeagueStatsPage id={'42'} />)
    }).not.toThrow()
  })
})
