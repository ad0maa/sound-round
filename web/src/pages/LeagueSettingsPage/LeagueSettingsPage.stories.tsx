import type { Meta, StoryObj } from '@storybook/react'

import LeagueSettingsPage from './LeagueSettingsPage'

const meta: Meta<typeof LeagueSettingsPage> = {
  component: LeagueSettingsPage,
}

export default meta

type Story = StoryObj<typeof LeagueSettingsPage>

export const Primary: Story = {}
