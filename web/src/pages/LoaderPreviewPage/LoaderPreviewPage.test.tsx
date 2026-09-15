import { render } from '@cedarjs/testing/web'

import LoaderPreviewPage from './LoaderPreviewPage'

//   Improve this test with help from the CedarJS Testing Doc:
//   https://cedarjs.com/docs/testing#testing-pages-layouts

describe('LoaderPreviewPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<LoaderPreviewPage />)
    }).not.toThrow()
  })
})
