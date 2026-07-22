import type { Meta, StoryObj } from '@storybook/react'

import ResultsPage from './ResultsPage'

const meta: Meta<typeof ResultsPage> = {
  component: ResultsPage,
}

export default meta

type Story = StoryObj<typeof ResultsPage>

export const Primary: Story = {}
