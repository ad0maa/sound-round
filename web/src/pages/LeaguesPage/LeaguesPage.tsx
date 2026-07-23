import { Plus } from 'lucide-react'

import { Link, routes } from '@cedarjs/router'
import { Metadata } from '@cedarjs/web'

import LeaguesCell from 'src/components/LeaguesCell'
import PageContainer from 'src/components/PageContainer/PageContainer'
import PageHeader from 'src/components/PageHeader/PageHeader'
import { Button } from 'src/components/ui/button'

const LeaguesPage = () => {
  return (
    <>
      <Metadata title="My Leagues" description="Your SoundRound leagues" />

      <PageContainer>
        <PageHeader
          title="My Leagues"
          description="Pick a league to jump back in."
        >
          <Button asChild>
            <Link to={routes.newLeague()}>
              <Plus className="h-4 w-4" />
              New League
            </Link>
          </Button>
        </PageHeader>

        <LeaguesCell />
      </PageContainer>
    </>
  )
}

export default LeaguesPage
