import type { Meta, StoryObj } from '@storybook/react'

import VotePage from './VotePage'

const meta: Meta<typeof VotePage> = {
  component: VotePage,
}

export default meta

type Story = StoryObj<typeof VotePage>

export const Primary: Story = {}
