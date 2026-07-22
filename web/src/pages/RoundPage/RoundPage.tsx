import { Metadata } from '@cedarjs/web'

import RoundCell from 'src/components/RoundCell'

type RoundPageProps = {
  id: string
  roundId: string
}

const RoundPage = ({ roundId }: RoundPageProps) => {
  return (
    <>
      <Metadata title="Round" description="Round details" />
      <RoundCell id={roundId} />
    </>
  )
}

export default RoundPage
