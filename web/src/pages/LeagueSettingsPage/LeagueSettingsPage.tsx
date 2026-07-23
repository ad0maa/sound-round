import { Metadata } from '@cedarjs/web'

import LeagueSettingsCell from 'src/components/LeagueSettingsCell'

type LeagueSettingsPageProps = {
  id: string
}

const LeagueSettingsPage = ({ id }: LeagueSettingsPageProps) => {
  return (
    <>
      <Metadata title="League Settings" description="Manage your league" />
      <LeagueSettingsCell id={id} />
    </>
  )
}

export default LeagueSettingsPage
