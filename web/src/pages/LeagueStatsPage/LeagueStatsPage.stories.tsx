import type { Meta, StoryObj } from '@storybook/react'

import LeagueStatsPage from './LeagueStatsPage'

const meta: Meta<typeof LeagueStatsPage> = {
  component: LeagueStatsPage,
}

export default meta

type Story = StoryObj<typeof LeagueStatsPage>

export const Primary: Story = {}
