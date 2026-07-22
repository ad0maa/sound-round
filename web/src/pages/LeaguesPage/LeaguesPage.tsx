import { Plus, Trophy } from 'lucide-react'

import { Link, routes } from '@cedarjs/router'
import { Metadata } from '@cedarjs/web'

import LeaguesCell from 'src/components/LeaguesCell'
import PageHeader from 'src/components/PageHeader/PageHeader'
import { Button } from 'src/components/ui/button'

const LeaguesPage = () => {
  return (
    <>
      <Metadata title="My Leagues" description="Your SoundRound leagues" />

      <PageHeader title="My Leagues" icon={Trophy}>
        <Button asChild size="sm">
          <Link to={routes.newLeague()}>
            <Plus className="h-4 w-4" />
            New League
          </Link>
        </Button>
      </PageHeader>

      <LeaguesCell />
    </>
  )
}

export default LeaguesPage
