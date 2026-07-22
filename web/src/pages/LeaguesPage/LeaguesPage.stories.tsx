import type { Meta, StoryObj } from '@storybook/react'

import LeaguesPage from './LeaguesPage'

const meta: Meta<typeof LeaguesPage> = {
  component: LeaguesPage,
}

export default meta

type Story = StoryObj<typeof LeaguesPage>

export const Primary: Story = {}
