import { render, screen } from '@cedarjs/testing/web'

import { Loading, Empty, Failure, Success } from './RoundCommentsCell'
import { standard } from './RoundCommentsCell.mock'

describe('RoundCommentsCell', () => {
  it('renders Loading successfully', () => {
    expect(() => {
      render(<Loading />)
    }).not.toThrow()
  })

  it('renders Empty with a composer', async () => {
    render(<Empty roundId="round-1" />)
    expect(
      await screen.findByText('No comments yet — be the first to weigh in.')
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Add a comment')).toBeInTheDocument()
  })

  it('renders Failure successfully', async () => {
    expect(() => {
      render(<Failure error={new Error('Oh no')} />)
    }).not.toThrow()
  })

  it('renders comments with authors', async () => {
    render(<Success comments={standard().comments} roundId="round-1" />)
    expect(await screen.findByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Robbed. Absolutely robbed.')).toBeInTheDocument()
  })
})
