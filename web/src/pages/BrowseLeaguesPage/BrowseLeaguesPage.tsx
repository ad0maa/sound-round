import { Metadata } from '@cedarjs/web'

import PageContainer from 'src/components/PageContainer/PageContainer'
import PageHeader from 'src/components/PageHeader/PageHeader'
import PublicLeaguesCell from 'src/components/PublicLeaguesCell'

const BrowseLeaguesPage = () => {
  return (
    <>
      <Metadata
        title="Browse Leagues"
        description="Discover public SoundRound leagues to join"
      />

      <PageContainer>
        <PageHeader
          title="Browse Leagues"
          description="Public leagues you can join right now."
        />
        <PublicLeaguesCell />
      </PageContainer>
    </>
  )
}

export default BrowseLeaguesPage
