import type { Meta, StoryObj } from '@storybook/react'

import BrowseLeaguesPage from './BrowseLeaguesPage'

const meta: Meta<typeof BrowseLeaguesPage> = {
  component: BrowseLeaguesPage,
}

export default meta

type Story = StoryObj<typeof BrowseLeaguesPage>

export const Primary: Story = {}
