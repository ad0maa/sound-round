import { Metadata } from '@cedarjs/web'

import LeagueStatsCell from 'src/components/LeagueStatsCell'

type LeagueStatsPageProps = {
  id: string
}

const LeagueStatsPage = ({ id }: LeagueStatsPageProps) => {
  return (
    <>
      <Metadata title="League Stats" description="League superlatives" />
      <LeagueStatsCell leagueId={id} />
    </>
  )
}

export default LeagueStatsPage
