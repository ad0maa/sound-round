import { Globe } from 'lucide-react'

import { Metadata } from '@cedarjs/web'

import PageHeader from 'src/components/PageHeader/PageHeader'
import PublicLeaguesCell from 'src/components/PublicLeaguesCell'

const BrowseLeaguesPage = () => {
  return (
    <>
      <Metadata
        title="Browse Leagues"
        description="Discover public SoundRound leagues to join"
      />

      <PageHeader title="Browse Leagues" icon={Globe} />

      <PublicLeaguesCell />
    </>
  )
}

export default BrowseLeaguesPage
