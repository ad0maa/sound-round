import { render } from '@cedarjs/testing/web'

import LeagueSettingsPage from './LeagueSettingsPage'

//   Improve this test with help from the CedarJS Testing Doc:
//   https://cedarjs.com/docs/testing#testing-pages-layouts

describe('LeagueSettingsPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<LeagueSettingsPage id={'42'} />)
    }).not.toThrow()
  })
})
