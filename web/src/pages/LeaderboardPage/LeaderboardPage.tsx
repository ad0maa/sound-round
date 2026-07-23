import { Metadata } from '@cedarjs/web'

import LeaderboardCell from 'src/components/LeaderboardCell'
import PageContainer from 'src/components/PageContainer/PageContainer'

type LeaderboardPageProps = {
  id: string
}

const LeaderboardPage = ({ id }: LeaderboardPageProps) => {
  return (
    <>
      <Metadata title="Leaderboard" description="League standings" />
      <PageContainer wide={false}>
        <LeaderboardCell leagueId={id} />
      </PageContainer>
    </>
  )
}

export default LeaderboardPage
