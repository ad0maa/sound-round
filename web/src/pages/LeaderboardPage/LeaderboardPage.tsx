import { Trophy } from 'lucide-react'

import { Metadata } from '@cedarjs/web'

import LeaderboardCell from 'src/components/LeaderboardCell'
import PageHeader from 'src/components/PageHeader/PageHeader'

type LeaderboardPageProps = {
  id: string
}

const LeaderboardPage = ({ id }: LeaderboardPageProps) => {
  return (
    <>
      <Metadata title="Leaderboard" description="League standings" />
      <PageHeader
        title="Leaderboard"
        icon={Trophy}
        description="See how the league stacks up"
      />
      <LeaderboardCell leagueId={id} />
    </>
  )
}

export default LeaderboardPage
