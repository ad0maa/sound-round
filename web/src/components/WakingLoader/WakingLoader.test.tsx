import { render } from '@cedarjs/testing/web'

import WakingLoader from './WakingLoader'

//   Improve this test with help from the CedarJS Testing Doc:
//    https://cedarjs.com/docs/testing#testing-components

describe('WakingLoader', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<WakingLoader />)
    }).not.toThrow()
  })
})
