import { Metadata } from '@cedarjs/web'

import LeagueCell from 'src/components/LeagueCell'

type LeaguePageProps = {
  id: string
}

const LeaguePage = ({ id }: LeaguePageProps) => {
  return (
    <>
      <Metadata title="League" description="League details" />
      <LeagueCell id={id} />
    </>
  )
}

export default LeaguePage
