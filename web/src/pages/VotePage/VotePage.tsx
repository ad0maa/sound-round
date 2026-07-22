import { Metadata } from '@cedarjs/web'

import VoteCell from 'src/components/VoteCell'

type VotePageProps = {
  id: string
  roundId: string
}

const VotePage = ({ id, roundId }: VotePageProps) => {
  return (
    <>
      <Metadata title="Vote" description="Cast your votes" />
      <VoteCell leagueId={id} roundId={roundId} />
    </>
  )
}

export default VotePage
